import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  initializeApp,
  getApps,
  getApp,
  cert,
  App,
  ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  public app: App | null = null;
  private isInitialized = false;

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const apps = getApps();
    if (apps.length > 0) {
      this.app = getApp();
      this.isInitialized = true;
      return;
    }

    const serviceAccountPath = path.resolve(
      process.cwd(),
      'firebase',
      'service-account.json',
    );

    try {
      if (fs.existsSync(serviceAccountPath)) {
        const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent) as ServiceAccount;

        this.app = initializeApp({
          credential: cert(serviceAccount),
        });
        this.isInitialized = true;
        this.logger.log(
          '🔥 Firebase Admin SDK initialized successfully via service-account.json',
        );
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let rawContent = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        // Handle potential base64 encoded string
        if (
          !rawContent.startsWith('{') &&
          /^[A-Za-z0-9+/=]+$/.test(rawContent)
        ) {
          rawContent = Buffer.from(rawContent, 'base64').toString('utf8');
        }

        const serviceAccount = JSON.parse(rawContent) as ServiceAccount;

        this.app = initializeApp({
          credential: cert(serviceAccount),
        });
        this.isInitialized = true;
        this.logger.log(
          '🔥 Firebase Admin SDK initialized successfully via FIREBASE_SERVICE_ACCOUNT',
        );
      } else if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        this.app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
        this.isInitialized = true;
        this.logger.log(
          '🔥 Firebase Admin SDK initialized successfully via environment variables',
        );
      } else {
        this.logger.warn(
          '⚠️ Firebase service account not found at firebase/service-account.json and env vars not set. FCM push notifications will run in mock mode.',
        );
      }
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Firebase initialization failed: ${errMessage}`);
    }
  }

  get messaging(): Messaging | null {
    if (this.isInitialized && this.app) {
      return getMessaging(this.app);
    }
    return null;
  }
}
