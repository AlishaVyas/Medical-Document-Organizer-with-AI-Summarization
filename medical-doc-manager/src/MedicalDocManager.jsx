// Updated styling version will be applied here. Starting with user's original code.

import { useState, useEffect } from "react";
import { marked } from "marked";
import { Image, FileText, Trash2, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MedicalDocManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/documents", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setDocuments(data);
        }
      } catch (err) {
        console.error("Failed to fetch docs", err);
      }
    };

    fetchDocs();
  }, []);

  const deleteDocument = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/documents/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    }
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
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ base64: base64, fileType: file.type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI summarization failed");
      }

      setDocuments((prev) => [data, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Failed to summarize document. Try another file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6 bg-cover bg-center flex justify-center"
      style={{
        backgroundImage:
          "url('https://i.pinimg.com/1200x/a8/51/9c/a8519c8b104ef1f944063a0fcc0d59da.jpg')",
      }}
    >
      <div className="max-w-5xl mx-auto w-full bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-yellow-200">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 shadow-md transition"
          >
            Logout
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-yellow-800 drop-shadow-md">
            MediVault
          </h1>
          <p className="text-yellow-700 mt-2 text-lg">
            Upload your medical documents and view summaries
          </p>
        </div>

        <div className="bg-yellow-50 rounded-2xl shadow-inner p-8 border border-yellow-200">
          <p className="text-yellow-800 font-semibold mb-3 text-lg">
            Upload Medical Document
          </p>

          <label className="block w-full h-40 border-2 border-dashed border-yellow-400 rounded-xl cursor-pointer hover:bg-yellow-100 transition flex items-center justify-center">
            <div className="text-center">
              <p className="text-yellow-700 font-bold text-lg">Click to Upload</p>
              <p className="text-sm text-yellow-600">PDF or Image</p>
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>

          {loading && <p className="mt-3 text-yellow-700">Analyzing document...</p>}
          {error && <p className="text-red-500 mt-3">{error}</p>}
        </div>

        <div className="space-y-6 mt-10">
          {documents.length === 0 ? (
            <div className="bg-yellow-50 rounded-xl shadow p-10 text-center text-yellow-600 border border-yellow-200">
              No documents uploaded yet.
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc._id}
                className="bg-white/80 rounded-2xl shadow-lg p-6 border border-yellow-200 hover:shadow-xl transition backdrop-blur"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-yellow-800 text-lg">{doc.name}</h3>
                  <button
                    onClick={() => deleteDocument(doc._id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div
                  className="mt-4 bg-yellow-100 rounded-lg p-3 flex items-center justify-center cursor-pointer border border-yellow-300"
                  onClick={() => setPreviewDoc(doc)}
                >
                  {doc.type.startsWith("image/") ? (
                    <img src={doc.fileData} className="h-40 object-contain rounded-md" />
                  ) : (
                    <div className="flex flex-col items-center text-yellow-700">
                      <FileText className="w-10 h-10 mb-2" />
                      <span>View PDF</span>
                    </div>
                  )}
                </div>

                <div
                  className="text-yellow-900 text-sm mt-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: marked.parse(doc.summary) }}
                />
                <div
                  className="text-yellow-900 text-sm mt-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: marked.parse(doc.uploadedAt) }}
                />
              </div>
            ))
          )}
        </div>

        {previewDoc && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="relative bg-white rounded-2xl max-w-4xl w-full max-h-full overflow-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewDoc(null)}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {previewDoc.type.startsWith("image/") ? (
                <img src={previewDoc.fileData} className="w-full h-auto rounded-b-2xl" />
              ) : (
                <iframe
                  src={previewDoc.fileData}
                  className="w-full h-[80vh] rounded-b-2xl"
                  title="PDF Preview"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
