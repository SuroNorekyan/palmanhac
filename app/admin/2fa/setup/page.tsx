import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminTwoFactorSetup } from "@/components/admin/AdminTwoFactorSetup";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AdminTwoFactorSetupPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const dictionaryEn = getDictionary("en");
  const dictionaryPt = getDictionary("pt");

  const en = {
    setupTitle: dictionaryEn.twoFactor.setupTitle,
    setupDescription: dictionaryEn.twoFactor.setupDescription,
    generateSecret: dictionaryEn.twoFactor.generateSecret,
    qrLabel: dictionaryEn.twoFactor.qrLabel,
    manualCodeLabel: dictionaryEn.twoFactor.manualCodeLabel,
    verificationLabel: dictionaryEn.twoFactor.verificationLabel,
    verifyButton: dictionaryEn.twoFactor.verifyButton,
    recoveryCodesTitle: dictionaryEn.twoFactor.recoveryCodesTitle,
    recoveryCodesDescription: dictionaryEn.twoFactor.recoveryCodesDescription,
    success: dictionaryEn.twoFactor.success,
    error: dictionaryEn.twoFactor.error,
  };

  const pt = {
    setupTitle: dictionaryPt.twoFactor.setupTitle,
    setupDescription: dictionaryPt.twoFactor.setupDescription,
    generateSecret: dictionaryPt.twoFactor.generateSecret,
    qrLabel: dictionaryPt.twoFactor.qrLabel,
    manualCodeLabel: dictionaryPt.twoFactor.manualCodeLabel,
    verificationLabel: dictionaryPt.twoFactor.verificationLabel,
    verifyButton: dictionaryPt.twoFactor.verifyButton,
    recoveryCodesTitle: dictionaryPt.twoFactor.recoveryCodesTitle,
    recoveryCodesDescription: dictionaryPt.twoFactor.recoveryCodesDescription,
    success: dictionaryPt.twoFactor.success,
    error: dictionaryPt.twoFactor.error,
  };

  return (
    <AdminTwoFactorSetup
      en={en}
      pt={pt}
      alreadyEnabled={Boolean(session.user.twoFAEnabled)}
    />
  );
}
