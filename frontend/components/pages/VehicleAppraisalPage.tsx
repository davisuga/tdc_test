import * as React from "react";
import { useNavigate } from "react-router";
import { PageLayout } from "components/templates/PageLayout";
import { VehicleAppraisalForm } from "components/organisms/VehicleAppraisalForm";
import { type Photo } from "components/molecules/PhotoGrid";
import { usePresignedUrls } from "hooks/usePresignedUrls";
import { useCreateVinSubmission } from "hooks/useCreateSubmission";

export function VehicleAppraisalPage() {
  const navigate = useNavigate();

  const [vin, setVin] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [mileage, setMileage] = React.useState("");

  type LocalFile = { id: string; file: File; previewUrl: string; alt: string };
  const [localFiles, setLocalFiles] = React.useState<LocalFile[]>([]);

  const [uploadProgress, setUploadProgress] = React.useState<
    { current: number; total: number } | undefined
  >(undefined);
  const [isUploading, setIsUploading] = React.useState(false);
  const { mutateAsync: createPresignedUrls, isPending: isCreatingPresignedUrls } = usePresignedUrls();
  const { mutateAsync: createVinSubmission, isPending: isSubmitting } =
    useCreateVinSubmission();

  const handleVinChange = (newVin: string) => {
    setVin(newVin);
  };

  const handleMileageChange = (newMileage: string) => {
    setMileage(newMileage);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
  };

  const handleUpload = async (files: FileList) => {
    const filesArr = Array.from(files);
    const newLocalFiles: LocalFile[] = filesArr.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      alt: file.name,
    }));

    setLocalFiles((prev) => [...prev, ...newLocalFiles]);
  };

  const handleAnalyze = async () => {
    const submitForAnalysis = async (
      paths: string[],
      vinToSubmit: string,
      notesToSubmit?: string,
      mileageToSubmit?: string
    ) => {
      try {
        const submission = await createVinSubmission({
          vin: vinToSubmit,
          description: notesToSubmit || undefined,
          mileage:
            mileageToSubmit && mileageToSubmit.length > 0
              ? Number(mileageToSubmit)
              : undefined,
          s3Paths: paths,
        });

        navigate(`/submissions/${submission!.id}`);
      } catch (error) {
        console.error("Failed to create submission:", error);
      }
    };

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

        const pathsToSubmit = uploadedUrls.map((u) => new URL(u).pathname);
        await submitForAnalysis(pathsToSubmit, vin, notes, mileage);
      } catch (error) {
        console.error("One or more uploads failed:", error);
      } finally {
        setIsUploading(false);
        setUploadProgress(undefined);
      }
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
        mileage={mileage}
        notes={notes}
        photos={photos}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        isSubmitting={isSubmitting}
        onVinChange={handleVinChange}
        onMileageChange={handleMileageChange}
        onUpload={handleUpload}
        onNotesChange={handleNotesChange}
        onAnalyze={handleAnalyze}
      />
    </PageLayout>
  );
}
