import { useMutation } from "@tanstack/react-query";
import { chain } from "services/graphql";

const createSignedUrls = async (files: string[]) => {
  return chain("mutation")({
    generateUploadUrls: [
      { filenames: files },
      {
        url: true,
      },
    ],
  });
};

export const usePresignedUrls = () => {
  return useMutation({
    mutationFn: createSignedUrls,
  });
};
