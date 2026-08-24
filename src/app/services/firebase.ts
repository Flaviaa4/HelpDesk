import { Injectable } from '@angular/core';
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
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
  ) {}

  async register(email: string, password: string, name: string) {
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
  }

  async login(email: string, password: string): Promise<any> {
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
  }

  async logout() {
    await signOut(this.auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const user = this.auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user.');
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }

  // Ticket numbers are a separate, sequential display ID (#1001, #1002, ...)
  // kept in a counters/tickets doc and assigned inside a transaction so
  // concurrent ticket creation never hands out the same number twice. The
  // Firestore document ID itself stays an opaque auto-generated string and
  // is only ever used internally (update/delete), never shown to users.
  async createTicket(data: any) {
    const counterRef = doc(this.firestore, 'counters', 'tickets');
    const ticketRef = doc(collection(this.firestore, 'tickets'));
    const ticketNumber = await runTransaction(this.firestore, async (tx) => {
      const counterSnap = await tx.get(counterRef);
      const next = (counterSnap.exists() ? counterSnap.data()['value'] : 1000) + 1;
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

    let next = all.reduce((max, t) => (t.ticketNumber && t.ticketNumber > max ? t.ticketNumber : max), 1000);

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
    return collectionData(collection(this.firestore, 'tickets'), { idField: 'id' }) as Observable<any[]>;
  }

  async getUserTickets(uid: string) {
    const q = query(collection(this.firestore, 'tickets'), where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  getTicketsByTechnicianRealtime(technicianUid: string): Observable<any[]> {
    const q = query(collection(this.firestore, 'tickets'), where('technicianId', '==', technicianUid));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  getTicketsByUserRealtime(userUid: string): Observable<any[]> {
    const q = query(collection(this.firestore, 'tickets'), where('userId', '==', userUid));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  async updateTicket(ticketId: string, data: any) {
    await updateDoc(doc(this.firestore, 'tickets', ticketId), data);
  }

  async deleteTicket(ticketId: string) {
    await deleteDoc(doc(this.firestore, 'tickets', ticketId));
  }

  private readonly maxAttachmentBytes = 10 * 1024 * 1024;

  // Note attachments live in Storage, keyed by ticket, with just the
  // resulting download URL + metadata stored on the note itself in
  // Firestore. Firestore rules already gate access on request.auth, but
  // Storage has its own separate rules — the console's default Storage
  // rules deny everything, so uploads will fail with storage/unauthorized
  // until Storage rules also allow authenticated read/write.
  async uploadTicketAttachment(ticketId: string, file: File) {
    if (file.size > this.maxAttachmentBytes) {
      throw new Error('File is too large (max 10MB).');
    }
    const path = `tickets/${ticketId}/${Date.now()}_${file.name}`;
    const fileRef = ref(this.storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { name: file.name, url, size: file.size, type: file.type || 'application/octet-stream' };
  }

  // Per-ticket conversation: notes are stored directly on the ticket doc so
  // they ride along with the existing real-time ticket listeners with no
  // extra subscription. Adding a note also flips the other party's unread
  // flag; opening the thread clears your own.
  async addTicketNote(
    ticketId: string,
    note: {
      author: string;
      role: 'technician' | 'user';
      text: string;
      attachment?: { name: string; url: string; size: number; type: string };
    },
    unreadFlag: 'unreadForUser' | 'unreadForTechnician',
  ) {
    const payload: any = { author: note.author, role: note.role, text: note.text, createdAt: new Date() };
    if (note.attachment) {
      payload.attachment = note.attachment;
    }
    await updateDoc(doc(this.firestore, 'tickets', ticketId), {
      notes: arrayUnion(payload),
      [unreadFlag]: true,
    });
  }

  async markTicketNotesRead(ticketId: string, unreadFlag: 'unreadForUser' | 'unreadForTechnician') {
    await updateDoc(doc(this.firestore, 'tickets', ticketId), { [unreadFlag]: false });
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
    return (collectionData(collection(this.firestore, 'users'), { idField: 'id' }) as Observable<any[]>).pipe(
      map((users) => users.map((u: any) => ({ ...u, uid: u.uid || u.id }))),
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

  async deleteUser(userId: string) {
    await deleteDoc(doc(this.firestore, 'users', userId));
  }

  async updateUser(userId: string, data: any) {
    await updateDoc(doc(this.firestore, 'users', userId), data);
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
