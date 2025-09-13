// components/pages/VehicleAppraisalPage.tsx
import * as React from "react";
import { PageLayout } from "components/templates/PageLayout";
import { VehicleAppraisalForm } from "components/organisms/VehicleAppraisalForm";
import { type Photo } from "components/molecules/PhotoGrid";
import { usePresignedUrls } from "hooks/usePresignedUrls";

export function VehicleAppraisalPage() {
  // Local state management
  const [vin, setVin] = React.useState("");
  const [notes, setNotes] = React.useState("");
  // localFiles now stores file + preview metadata so we can derive photos without a separate photos state
  type LocalFile = { id: string; file: File; previewUrl: string; alt: string };
  const [localFiles, setLocalFiles] = React.useState<LocalFile[]>([]);
  const [uploadedMeta, setUploadedMeta] = React.useState<
    { url: string; filename?: string }[]
  >([]);
  const [uploadProgress, setUploadProgress] = React.useState<
    { current: number; total: number } | undefined
  >(undefined);
  const [isUploading, setIsUploading] = React.useState(false);
  const { mutateAsync: createPresignedUrls, isPending } = usePresignedUrls();
  // Handlers
  const handleVinChange = (newVin: string) => {
    setVin(newVin);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
  };

  const handleUpload = async (files: FileList) => {
    // Store files in local state without uploading
    const filesArr = Array.from(files);
    const newLocalFiles: LocalFile[] = filesArr.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      alt: file.name,
    }));

    // Append to localFiles; previews are derived from these entries
    setLocalFiles((prev) => [...prev, ...newLocalFiles]);
  };

  const handleAnalyze = async () => {
    // Function that accepts only paths and vin for submission
    const submitForAnalysis = async (
      paths: string[],
      vinToSubmit: string,
      notesToSubmit?: string
    ) => {
      // TODO: replace with real analysis submission API
      console.log("Submitting for analysis", {
        vin: vinToSubmit,
        paths,
        notes: notesToSubmit,
      });
    };

    // If we have local files, upload them first
    if (localFiles.length > 0) {
      const fileNames = localFiles.map((lf) => lf.file.name);
      const { generateUploadUrls: response } =
        await createPresignedUrls(fileNames);
      const urls = response?.map((item) => item.url);

      if (!urls || urls.length === 0) {
        console.error("Failed to get presigned URLs");
        return;
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: localFiles.length });

      // Actually upload files to presigned URLs
      const uploadPromises = localFiles.map(async (lf, index) => {
        const file = lf.file;
        const presignedUrl = urls[index];
        if (!presignedUrl) {
          throw new Error(`Missing presigned URL for file ${file.name}`);
        }

        try {
          const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          // Update progress after each successful upload
          setUploadProgress((prev) =>
            prev ? { ...prev, current: prev.current + 1 } : undefined
          );

          return {
            id: `${Date.now()}-${index}`,
            url: presignedUrl,
            alt: file.name,
          };
        } catch (error) {
          console.error("Upload failed:", error);
          setUploadProgress((prev) =>
            prev ? { ...prev, current: prev.current + 1 } : undefined
          );
          throw error;
        }
      });

      try {
        const uploadedPhotos = await Promise.all(uploadPromises);
        const uploadedUrls = uploadedPhotos.map((p) => p.url);


        // Submit for analysis with combined paths and notes
        const pathsToSubmit = uploadedUrls.map((u) => new URL(u).pathname);
        await submitForAnalysis(pathsToSubmit, vin, notes);
      } catch (error) {
        console.error("One or more uploads failed:", error);
      } finally {
        setIsUploading(false);
        setUploadProgress(undefined);
        // Keep localFiles and previews so UI continues to show local previews after upload
      }
    }
    else {
      // No files to upload; still submit VIN + notes if provided
      await submitForAnalysis([], vin, notes);
    }
  };

  const photos: Photo[] = localFiles.map((lf) => ({
    id: lf.id,
    url: lf.previewUrl,
    alt: lf.alt,
  }));

  return (
    <PageLayout>
      <VehicleAppraisalForm
        vin={vin}
        notes={notes}
        photos={photos}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        onVinChange={handleVinChange}
        onUpload={handleUpload}
        onNotesChange={handleNotesChange}
        onAnalyze={handleAnalyze}
      />
    </PageLayout>
  );
}
