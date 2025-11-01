import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminTwoFactorChallenge } from "@/components/admin/AdminTwoFactorChallenge";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AdminTwoFactorChallengePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  if (session.user.twoFAEnabled && session.twoFAVerified) {
    redirect("/admin");
  }

  const dictionaryEn = getDictionary("en");
  const dictionaryPt = getDictionary("pt");

  const en = {
    challengeTitle: dictionaryEn.twoFactor.challengeTitle,
    challengeDescription: dictionaryEn.twoFactor.challengeDescription,
    verificationLabel: dictionaryEn.twoFactor.verificationLabel,
    recoveryCodeLabel: dictionaryEn.twoFactor.recoveryCodeLabel,
    submitButton: dictionaryEn.twoFactor.submitButton,
    success: dictionaryEn.twoFactor.success,
    error: dictionaryEn.twoFactor.error,
  };

  const pt = {
    challengeTitle: dictionaryPt.twoFactor.challengeTitle,
    challengeDescription: dictionaryPt.twoFactor.challengeDescription,
    verificationLabel: dictionaryPt.twoFactor.verificationLabel,
    recoveryCodeLabel: dictionaryPt.twoFactor.recoveryCodeLabel,
    submitButton: dictionaryPt.twoFactor.submitButton,
    success: dictionaryPt.twoFactor.success,
    error: dictionaryPt.twoFactor.error,
  };

  return <AdminTwoFactorChallenge en={en} pt={pt} />;
}
