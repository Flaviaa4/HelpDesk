import { Injectable, NgZone } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  collectionData,
  runTransaction,
  writeBatch,
  arrayUnion,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private ngZone: NgZone,
  ) {}

  // Proven with diagnostic logging, not assumed: even with zone.js properly
  // installed and active, Firestore's real-time listener callback (from
  // collectionData/onSnapshot) still fires OUTSIDE the Angular zone —
  // NgZone.isInAngularZone() was true when .subscribe() ran in ngOnInit,
  // but false inside the next() callback itself. AngularFire ships its own
  // zone-rewrapping for exactly this gap, gated on Angular's DI injection
  // context being active at call time — which fails here (see the "outside
  // injection context" console warning), so its protection never engages.
  // Forcing every emission back into the zone here is the fix; it does not
  // depend on AngularFire's wrapping succeeding.
  private realtime<T>(source: Observable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      const sub = source.subscribe({
        next: (value) => this.ngZone.run(() => subscriber.next(value)),
        error: (err) => this.ngZone.run(() => subscriber.error(err)),
        complete: () => this.ngZone.run(() => subscriber.complete()),
      });
      return () => sub.unsubscribe();
    });
  }

  // Same zone-escape risk as realtime() above, but for one-shot Auth/Firestore
  // calls (login, register, writes): AngularFire's own re-wrapping is gated
  // on Angular's DI injection context being active at call time, which our
  // components' ngOnInit/event-handler calls don't satisfy, so it silently
  // falls back to the raw, zone-unaware Firebase call. Forcing the
  // settle callback back into the zone here is what makes a caller's
  // `await this.firebase.x()` continuation (setting errorMsg, loading, etc.)
  // actually repaint the screen.
  private zonePromise<T>(promise: Promise<T>): Promise<T> {
    return promise.then(
      (value) => this.ngZone.run(() => value),
      (err) => this.ngZone.run(() => {
        throw err;
      }),
    );
  }

  register(email: string, password: string, name: string) {
    return this.zonePromise(
      (async () => {
        let role = 'user';
        if (email.endsWith('@ahelpdesk.com')) {
          role = 'admin';
        } else if (email.endsWith('@thelpdesk.com')) {
          role = 'technician';
        } else if (email.endsWith('@uhelpdesk.com')) {
          role = 'user';
        }

        const cred = await createUserWithEmailAndPassword(this.auth, email, password);
        await addDoc(collection(this.firestore, 'users'), {
          uid: cred.user.uid,
          name,
          email,
          role,
          createdAt: new Date(),
        });
        return cred;
      })(),
    );
  }

  login(email: string, password: string) {
    return this.zonePromise(
      (async (): Promise<any> => {
        const cred = await signInWithEmailAndPassword(this.auth, email, password);

        const usersRef = collection(this.firestore, 'users');
        const q = query(usersRef, where('uid', '==', cred.user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          return { uid: cred.user.uid, ...userData };
        }
        const byId = await getDoc(doc(this.firestore, 'users', cred.user.uid));
        if (byId.exists()) {
          return { uid: cred.user.uid, ...byId.data() };
        }

        // No Firestore profile for an otherwise-valid Firebase Auth account
        // means an admin deleted this user. The client SDK can only delete
        // the currently-signed-in user's Auth account, not an arbitrary
        // other user's, so the Firestore profile is the only thing an admin
        // can actually remove. Enforcing access here, at login, is what
        // actually revokes the account instead of leaving it able to sign
        // back in with a fallback 'user' role.
        await signOut(this.auth);
        const err: any = new Error('This account no longer exists.');
        err.code = 'account-not-found';
        throw err;
      })(),
    );
  }

  async logout() {
    await signOut(this.auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.zonePromise(
      (async () => {
        const user = this.auth.currentUser;
        if (!user || !user.email) {
          throw new Error('No authenticated user.');
        }
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
      })(),
    );
  }

  // Ticket numbers are a separate, sequential display ID (01, 02, ...)
  // kept in a counters/tickets doc and assigned inside a transaction so
  // concurrent ticket creation never hands out the same number twice. The
  // Firestore document ID itself stays an opaque auto-generated string and
  // is only ever used internally (update/delete), never shown to users.
  createTicket(data: any) {
    return this.zonePromise(
      (async () => {
        const counterRef = doc(this.firestore, 'counters', 'tickets');
        const ticketRef = doc(collection(this.firestore, 'tickets'));
        const ticketNumber = await runTransaction(this.firestore, async (tx) => {
          const counterSnap = await tx.get(counterRef);
          const next = (counterSnap.exists() ? counterSnap.data()['value'] : 0) + 1;
          tx.set(counterRef, { value: next }, { merge: true });
          tx.set(ticketRef, {
            ...data,
            ticketNumber: next,
            status: 'open',
            createdAt: new Date(),
          });
          return next;
        });
        return { id: ticketRef.id, ticketNumber };
      })(),
    );
  }

  // One-time migration for tickets created before ticket numbers existed.
  // Assigns numbers in creation order, continuing from the current counter,
  // and never touches a ticket that already has a number. Safe to call
  // repeatedly — it's a no-op once every ticket has one.
  async backfillTicketNumbers() {
    const snapshot = await getDocs(collection(this.firestore, 'tickets'));
    const all = snapshot.docs.map((d) => ({ ref: d.ref, ...d.data() }) as any);
    const missing = all.filter((t) => !t.ticketNumber);
    if (missing.length === 0) return;

    missing.sort((a, b) => this.timestampMillis(a.createdAt) - this.timestampMillis(b.createdAt));

    let next = all.reduce((max, t) => (t.ticketNumber && t.ticketNumber > max ? t.ticketNumber : max), 0);

    const chunkSize = 450;
    for (let i = 0; i < missing.length; i += chunkSize) {
      const batch = writeBatch(this.firestore);
      for (const t of missing.slice(i, i + chunkSize)) {
        next += 1;
        batch.update(t.ref, { ticketNumber: next });
      }
      await batch.commit();
    }

    await setDoc(doc(this.firestore, 'counters', 'tickets'), { value: next }, { merge: true });
  }

  // One-time migration off the old 1000+ offset scheme down to a clean
  // 1, 2, 3... sequence, preserving relative order (by existing ticket
  // number, falling back to creation time). Detects whether any ticket is
  // still numbered >= 1000 so it's safe to call on every load — once
  // every ticket is renumbered below 1000, this is a no-op forever after.
  async resetTicketNumbersIfNeeded() {
    const snapshot = await getDocs(collection(this.firestore, 'tickets'));
    const all = snapshot.docs.map((d) => ({ ref: d.ref, id: d.id, ...d.data() }) as any);
    const needsReset = all.some((t) => (t.ticketNumber || 0) >= 1000);
    if (!needsReset) return;

    all.sort(
      (a, b) =>
        (a.ticketNumber || 0) - (b.ticketNumber || 0) ||
        this.timestampMillis(a.createdAt) - this.timestampMillis(b.createdAt),
    );

    let next = 0;
    const chunkSize = 450;
    for (let i = 0; i < all.length; i += chunkSize) {
      const batch = writeBatch(this.firestore);
      for (const t of all.slice(i, i + chunkSize)) {
        next += 1;
        batch.update(t.ref, { ticketNumber: next });
      }
      await batch.commit();
    }

    await setDoc(doc(this.firestore, 'counters', 'tickets'), { value: next }, { merge: true });
  }

  private timestampMillis(value: any): number {
    if (value?.toMillis) return value.toMillis();
    if (value?.seconds) return value.seconds * 1000;
    return 0;
  }

  async getTickets() {
    const snapshot = await getDocs(collection(this.firestore, 'tickets'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  getTicketsRealtime(): Observable<any[]> {
    return this.realtime(
      collectionData(collection(this.firestore, 'tickets'), { idField: 'id' }) as Observable<any[]>,
    );
  }

  async getUserTickets(uid: string) {
    const q = query(collection(this.firestore, 'tickets'), where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  getTicketsByTechnicianRealtime(technicianUid: string): Observable<any[]> {
    const q = query(collection(this.firestore, 'tickets'), where('technicianId', '==', technicianUid));
    return this.realtime(collectionData(q, { idField: 'id' }) as Observable<any[]>);
  }

  getTicketsByUserRealtime(userUid: string): Observable<any[]> {
    const q = query(collection(this.firestore, 'tickets'), where('userId', '==', userUid));
    return this.realtime(collectionData(q, { idField: 'id' }) as Observable<any[]>);
  }

  updateTicket(ticketId: string, data: any) {
    return this.zonePromise(updateDoc(doc(this.firestore, 'tickets', ticketId), data));
  }

  deleteTicket(ticketId: string) {
    return this.zonePromise(deleteDoc(doc(this.firestore, 'tickets', ticketId)));
  }

  // Per-ticket conversation: notes are stored directly on the ticket doc so
  // they ride along with the existing real-time ticket listeners with no
  // extra subscription. Adding a note also flips the other party's unread
  // flag; opening the thread clears your own.
  addTicketNote(
    ticketId: string,
    note: { author: string; role: 'technician' | 'user'; text: string },
    unreadFlag: 'unreadForUser' | 'unreadForTechnician',
  ) {
    const payload = { author: note.author, role: note.role, text: note.text, createdAt: new Date() };
    return this.zonePromise(
      updateDoc(doc(this.firestore, 'tickets', ticketId), {
        notes: arrayUnion(payload),
        [unreadFlag]: true,
      }),
    );
  }

  markTicketNotesRead(ticketId: string, unreadFlag: 'unreadForUser' | 'unreadForTechnician') {
    return this.zonePromise(updateDoc(doc(this.firestore, 'tickets', ticketId), { [unreadFlag]: false }));
  }

  async getUserByUid(uid: string) {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('uid', '==', uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }

    const byId = await getDoc(doc(this.firestore, 'users', uid));
    if (byId.exists()) {
      return { id: byId.id, ...byId.data() };
    }

    return null;
  }

  async getUsers() {
    const snapshot = await getDocs(collection(this.firestore, 'users'));
    return snapshot.docs.map((d) => this.normalizeUserDoc(d));
  }

  getUsersRealtime(): Observable<any[]> {
    return this.realtime(
      (collectionData(collection(this.firestore, 'users'), { idField: 'id' }) as Observable<any[]>).pipe(
        map((users) => users.map((u: any) => ({ ...u, uid: u.uid || u.id }))),
      ),
    );
  }

  async getTechnicians() {
    const q = query(collection(this.firestore, 'users'), where('role', '==', 'technician'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.normalizeUserDoc(d));
  }

  private normalizeUserDoc(d: any) {
    const data = d.data();
    return { id: d.id, ...data, uid: data.uid || d.id };
  }

  deleteUser(userId: string) {
    return this.zonePromise(deleteDoc(doc(this.firestore, 'users', userId)));
  }

  updateUser(userId: string, data: any) {
    return this.zonePromise(updateDoc(doc(this.firestore, 'users', userId), data));
  }

  async getStats(uid?: string) {
    let tickets: any[];
    if (uid) {
      tickets = await this.getUserTickets(uid);
    } else {
      tickets = await this.getTickets();
    }
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
    };
  }
}
