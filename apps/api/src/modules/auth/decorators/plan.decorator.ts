import { SetMetadata } from '@nestjs/common';

export const PLAN_KEY = 'required_plan';
export const RequirePlan = (plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS') => SetMetadata(PLAN_KEY, plan);
