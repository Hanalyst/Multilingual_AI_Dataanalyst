import { useContext, useRef } from "react";
import API from "../../services/api";
import { DatasetContext } from "../../context/DatasetContext";

function UploadDataset({ onUploadSuccess }) {
  const { setDatasetId } = useContext(DatasetContext);
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/upload", formData);
      const dataset = res.data;
      const newId = String(dataset.id);
      setDatasetId(newId);
      localStorage.setItem("dataset_id", newId);
      if (onUploadSuccess) onUploadSuccess(newId, dataset.name);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    }
    e.target.value = "";
  };

  return (
    <div className="upload-area">
      <span className="upload-label">Upload</span>
      <label className="upload-btn" onClick={() => fileRef.current.click()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
        </svg>
        Upload CSV
      </label>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}

export default UploadDataset;
