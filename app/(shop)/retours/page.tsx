import { LegalPageView, legalMetadata } from "@/components/shop/legal-page";

export const revalidate = 86400;
export const generateMetadata = () => legalMetadata("retours");

export default function Page() {
  return <LegalPageView slug="retours" />;
}
