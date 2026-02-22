import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient, UserRole } from '@prisma/client';
import { ROLES_KEY } from './decorators/roles.decorator';

const prisma = new PrismaClient();

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // No roles restricted for this route
        }

        const request = context.switchToHttp().getRequest();
        const firebaseUser = request.user;

        if (!firebaseUser || !firebaseUser.uid) {
            throw new ForbiddenException('User not authenticated via Firebase');
        }

        // Handle the development mock token scenario
        if (firebaseUser.uid === 'mock-staff-id' || firebaseUser.uid === 'mock-superadmin-id') {
            // For mock-superadmin-id, give it PLATFORM_ADMIN
            if (requiredRoles.includes('PLATFORM_ADMIN') && firebaseUser.uid === 'mock-superadmin-id') {
                return true;
            } else if (!requiredRoles.includes('PLATFORM_ADMIN') && firebaseUser.uid === 'mock-staff-id') {
                // mock-staff-id passes non-superadmin checks (e.g. BUSINESS_OWNER, STAFF if implemented)
                // For now, superadmin endpoints require PLATFORM_ADMIN, so mock-staff-id would fail here.
                // This ensures security even with mock tokens.
            }
        }

        // Fetch user from database using firebaseUid to check actual role
        const user = await prisma.user.findUnique({
            where: { firebaseUid: firebaseUser.uid },
            select: { role: true }
        });

        if (!user) {
            throw new ForbiddenException('User record not found in database');
        }

        const hasRole = requiredRoles.includes(user.role as UserRole);

        if (!hasRole) {
            throw new ForbiddenException('Access Denied: You do not have the required permissions');
        }

        return true;
    }
}
