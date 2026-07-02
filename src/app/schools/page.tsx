import SchoolsDirectoryPage from "@/components/school/SchoolsDirectoryPage";
import { fetchSchoolsRanking } from "@/lib/server/school-feeds";
import { getDbOrNull } from "@/lib/server/works";

export default async function SchoolsPage() {
  const db = await getDbOrNull();
  const schools = db ? await fetchSchoolsRanking(db) : [];

  return <SchoolsDirectoryPage schools={schools} />;
}
