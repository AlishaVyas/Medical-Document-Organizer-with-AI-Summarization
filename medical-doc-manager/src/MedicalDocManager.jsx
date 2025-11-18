import { useState } from "react";
import { marked } from "marked";
import { Image, FileText, Trash2, Eye, X } from "lucide-react";
import { useEffect } from "react";


export default function MedicalDocManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);



  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await fetch("http://localhost:5000/documents");
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    };

    fetchDocs();
  }, []);


  const deleteDocument = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch("http://localhost:5000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64: base64,
          fileType: file.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI summarization failed");
      }

      const newDoc = {
        id: Date.now(),
        name: file.name,
        type: file.type,
        uploadedAt: new Date().toLocaleString(),
        summary: data.summary,
        fileData: `data:${file.type};base64,${base64}`,
      };

      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Failed to summarize document. Try another file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Medical Document Hub
          </h1>
          <p className="text-gray-600">
            Upload your medical documents and view summaries
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow p-8 mb-8">
          <p className="text-gray-700 font-medium mb-2">
            Upload Medical Document
          </p>

          <label className="block w-full h-40 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-blue-600 font-semibold">Click to Upload</p>
              <p className="text-sm text-gray-500">PDF or Image</p>
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>

          {loading && (
            <p className="mt-2 text-blue-600">Analyzing document...</p>
          )}

          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        {/* Documents List */}
        <div className="space-y-4 mt-8">
          {documents.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
              No documents uploaded yet.
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
              >
                {/* Header + Delete */}
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800">{doc.name}</h3>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* File Preview Area */}
                <div
                  className="mt-4 bg-gray-100 rounded-lg p-3 flex items-center justify-center cursor-pointer"
                  onClick={() => setPreviewDoc(doc)}
                >
                  {doc.type.startsWith("image/") ? (
                    <img
                      src={doc.fileData}
                      className="h-40 object-contain"
                      alt="document-preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-600">
                      <FileText className="w-10 h-10 mb-2" />
                      <span>View PDF</span>
                    </div>
                  )}
                </div>
                {/* Summary */}
                <div
                  className="text-gray-700 text-sm mt-3 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(doc.summary),
                  }}
                />
              </div>
            ))
          )}
        </div>

        {/* Preview Modal */}
        {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative bg-white rounded-lg max-w-4xl w-full max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2"
            >
              <X className="w-5 h-5" />
            </button>

            {previewDoc.type.startsWith("image/") ? (
              <img src={previewDoc.fileData} className="w-full h-auto" />
            ) : (
              <iframe src={previewDoc.fileData} className="w-full h-[80vh]" title="PDF Preview" />
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
