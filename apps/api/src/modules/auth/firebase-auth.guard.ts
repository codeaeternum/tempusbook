import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    private firebaseApp: admin.app.App | null = null;

    constructor(
        private reflector: Reflector,
        private configService: ConfigService,
    ) {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        if (admin.apps.length === 0) {
            const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
            const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
            const privateKey = this.configService
                .get<string>('FIREBASE_PRIVATE_KEY')
                ?.replace(/\\n/g, '\n');

            if (projectId && clientEmail && privateKey) {
                try {
                    this.firebaseApp = admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId,
                            clientEmail,
                            privateKey,
                        }),
                    });
                } catch (e) {
                    console.warn('⚠️ Firebase Initialization Failed (Check your Service Account PEM). Proceeding in Mock Mode if NODE_ENV=development.');
                }
            } else {
                console.warn('⚠️ Firebase configuration is missing from .env. Proceeding in Mock Mode if NODE_ENV=development.');
            }
        } else {
            this.firebaseApp = admin.apps[0]!;
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            if (!this.firebaseApp) {
                // In development without Firebase, allow with mock
                if (this.configService.get('NODE_ENV') === 'development' || !process.env.NODE_ENV) {
                    if (token === 'mock-dev-token' || token === 'mock-general-token') {
                        request.user = { uid: 'mock-general-id', email: 'general@dev.aeternasuite.com' };
                        return true;
                    }
                    if (token.startsWith('mock-') && token.endsWith('-token')) {
                        const vertical = token.substring(5, token.length - 6); // Extract everything between mock- and -token
                        request.user = { uid: `mock-${vertical}-id`, email: `${vertical}@dev.aeternasuite.com` };
                        return true;
                    }
                }
                throw new UnauthorizedException('Firebase not configured');
            }

            const decodedToken = await admin.auth().verifyIdToken(token);
            request.user = decodedToken;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
