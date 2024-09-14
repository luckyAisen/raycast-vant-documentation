import { useMemo, useRef } from "react";
import { Toast, showToast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import fetch from "node-fetch";
import { GITHUB_API, getToastText } from "@/utils";

import type { DocItem, DetailsData } from "@/type";

const cleanupContent = (language: string, docItem: DocItem, res: DetailsData): string => {
  const content = Buffer.from(res.content, "base64").toString("utf-8");

  // // Find all links and replace the href with the full url
  // content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (match, text, href) => {
  //   if (href.startsWith("http")) {
  //     return match;
  //   }

  //   const url = `${VANT_WEBSITE}/${docItem.version}/#/${language}/${href.split("/").at(-1).split("#").at(0)}`;

  //   // console.log(`[${text}](${url})`);

  //   return `[${text}](${url})`;
  // });

  return content;
};

export const useDetails = (language: string, docItem: DocItem) => {
  const abortable = useRef<AbortController>();
  const { isLoading, data, revalidate, error } = useCachedPromise(
    async (url: string) => {
      showToast({
        style: Toast.Style.Animated,
        title: getToastText(language, Toast.Style.Animated),
      });

      const response = await fetch(url, { signal: abortable.current?.signal });
      if (response.status !== 200) {
        throw new Error(`${response.status} - ${response.statusText}`);
      }

      const res = (await response.json()) as DetailsData;

      const content = cleanupContent(language, docItem, res);

      showToast({
        style: Toast.Style.Success,
        title: getToastText(language, Toast.Style.Success),
      });

      return content;
    },
    [GITHUB_API + docItem.filePath],
    {
      keepPreviousData: true,
      abortable,
      onError: () => {
        showToast({
          style: Toast.Style.Failure,
          title: getToastText(language, Toast.Style.Failure),
        });
      },
    },
  );

  const content = useMemo(() => {
    return data || "";
  }, [data]);

  return { isLoading, content, revalidate, error };
};
