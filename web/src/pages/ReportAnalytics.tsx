import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";


export default function ReportAnalytics() {
  const navigate = useNavigate();

  return (
    <Layout
      activeItem="reports"
      breadcrumbs={["Admin", "Report & Analytics"]}
      onNavigate={(path) => navigate(`/${path}`)}>
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Report Analytics</h2>
        <p className="text-gray-600">This is where report analytics will be displayed.</p>
      </div>
    </Layout>
  );
}