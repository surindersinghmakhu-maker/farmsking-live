import React, { ReactNode, useEffect, useState } from 'react';
import { AdminActionOtpModal } from './AdminActionOtpModal';

export interface StepUpChallengeOptions<T> {
  title?: string;
  description?: string;
  execute: (otp: string) => Promise<T>;
}

interface ActiveStepUpRequest<T = any> {
  title?: string;
  description?: string;
  execute: (otp: string) => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: any) => void;
}

export const STEP_UP_CANCELLED_CODE = 'ADMIN_STEPUP_CANCELLED';

let activeLauncher: ((req: ActiveStepUpRequest) => void) | null = null;

/**
 * Prompts the logged-in Admin/Super Admin with mandatory Step-Up 2FA OTP modal,
 * runs the critical API action with the 6-digit OTP, and keeps the modal open on error
 * so invalid OTP attempts can be retried cleanly without losing unsaved form changes.
 */
export function executeWithAdminStepUpOtp<T>(options: StepUpChallengeOptions<T>): Promise<T> {
  if (!activeLauncher) {
    return Promise.reject(new Error('Admin Step-Up 2FA modal host is not mounted.'));
  }
  return new Promise<T>((resolve, reject) => {
    activeLauncher!({
      title: options.title,
      description: options.description,
      execute: options.execute,
      resolve,
      reject,
    });
  });
}

export function isStepUpCancelledError(err: any): boolean {
  return err?.code === STEP_UP_CANCELLED_CODE || err?.message === 'Authorization cancelled by administrator.';
}

export function AdminStepUpProvider({ children }: { children: ReactNode }) {
  const [currentReq, setCurrentReq] = useState<ActiveStepUpRequest | null>(null);

  useEffect(() => {
    activeLauncher = (req) => {
      setCurrentReq(req);
    };
    return () => {
      activeLauncher = null;
    };
  }, []);

  const handleConfirm = async (otp: string) => {
    if (!currentReq) return;
    const result = await currentReq.execute(otp);
    const resolveFn = currentReq.resolve;
    setCurrentReq(null);
    resolveFn(result);
  };

  const handleCancel = () => {
    if (!currentReq) return;
    const rejectFn = currentReq.reject;
    setCurrentReq(null);
    const cancelErr: any = new Error('Authorization cancelled by administrator.');
    cancelErr.code = STEP_UP_CANCELLED_CODE;
    rejectFn(cancelErr);
  };

  return (
    <>
      {children}
      <AdminActionOtpModal
        visible={Boolean(currentReq)}
        title={currentReq?.title}
        description={currentReq?.description}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

