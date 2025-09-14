// components/pages/VehicleAppraisalPage.tsx
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { PageLayout } from "components/templates/PageLayout";
import { VehicleAppraisalForm } from "components/organisms/VehicleAppraisalForm";
import { type Photo } from "components/molecules/PhotoGrid";
import { usePresignedUrls } from "hooks/usePresignedUrls";
import { useCreateVinSubmission } from "hooks/useCreateVinSubmission";

export function VehicleAppraisalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if we have a submission ID in URL parameters  
  const submissionId = searchParams.get('submissionId');
  const isInProgress = submissionId !== null;

  // Local state management
  const [vin, setVin] = React.useState("");
  const [mileage, setMileage] = React.useState("");
  const [notes, setNotes] = React.useState("");
  
  // Cache key for localStorage
  const cacheKey = `vehicle-appraisal-${submissionId || 'new'}`;
  
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
  const { mutateAsync: createVinSubmission, isPending: isSubmitting } = useCreateVinSubmission();

  // Load cached data on mount
  React.useEffect(() => {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const { vin: cachedVin, mileage: cachedMileage, notes: cachedNotes, photos } = JSON.parse(cachedData);
        if (cachedVin) setVin(cachedVin);
        if (cachedMileage) setMileage(cachedMileage);
        if (cachedNotes) setNotes(cachedNotes);
        
        // Restore photos from cache URLs (these are blob URLs, might not work after page refresh)
        if (photos?.length > 0) {
          const restoredFiles = photos.map((photo: any) => ({
            id: photo.id,
            file: null, // File object cannot be serialized, so we lose it
            previewUrl: photo.url,
            alt: photo.alt,
          }));
          setLocalFiles(restoredFiles);
        }
      } catch (error) {
        console.error('Failed to parse cached data:', error);
      }
    }
  }, [cacheKey]);

  // Cache data when it changes
  React.useEffect(() => {
    const dataToCache = {
      vin,
      mileage,
      notes,
      photos: localFiles.map(f => ({ id: f.id, url: f.previewUrl, alt: f.alt }))
    };
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
  }, [vin, mileage, notes, localFiles, cacheKey]);
  // Handlers
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
      mileageToSubmit?: number,
      notesToSubmit?: string
    ) => {
      try {
        const result = await createVinSubmission({
          vin: vinToSubmit,
          description: notesToSubmit || undefined,
          mileage: mileageToSubmit || undefined,
          s3Paths: paths,
        });
        
        console.log("VIN submission created successfully:", result);
        
        // Add submission ID to URL parameters to indicate it's in progress
        const newSubmissionId = result.createVinSubmission.id;
        navigate(`?submissionId=${newSubmissionId}`, { replace: true });
        
        // Clear cache for the 'new' state and create cache for this submission
        localStorage.removeItem('vehicle-appraisal-new');
        
        // TODO: Start background processing of VIN data and market comparison
        // TODO: Handle success (e.g., show success message, redirect, etc.)
      } catch (error) {
        console.error("Failed to submit VIN data:", error);
        throw error;
      }
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
        await submitForAnalysis(pathsToSubmit, vin, mileage ? parseInt(mileage) : undefined, notes);
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
      await submitForAnalysis([], vin, mileage ? parseInt(mileage) : undefined, notes);
    }
  };

  const photos: Photo[] = localFiles.map((lf) => ({
    id: lf.id,
    url: lf.previewUrl,
    alt: lf.alt,
  }));

  return (
    <PageLayout>
      {isInProgress && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                🔄 Vehicle submission in progress... Analyzing VIN and comparing market prices.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Submission ID: {submissionId}
              </p>
            </div>
          </div>
        </div>
      )}
      <VehicleAppraisalForm
        vin={vin}
        mileage={mileage}
        notes={notes}
        photos={photos}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        isSubmitting={isSubmitting || isInProgress}
        onVinChange={handleVinChange}
        onMileageChange={handleMileageChange}
        onUpload={handleUpload}
        onNotesChange={handleNotesChange}
        onAnalyze={handleAnalyze}
      />
    </PageLayout>
  );
}
