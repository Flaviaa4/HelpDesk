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
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  collectionData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
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
  async login(email: string, password: string) {
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

    console.warn(
      `No Firestore "users" document found for uid ${cred.user.uid} (${email}). Falling back to role 'user'.`,
    );
    return { uid: cred.user.uid, email, role: 'user' };
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

  async createTicket(data: any) {
    return await addDoc(collection(this.firestore, 'tickets'), {
      ...data,
      status: 'open',
      createdAt: new Date(),
    });
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
