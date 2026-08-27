import Image from "next/image";

import type { BrandAsset } from "@/content/schema";

type BrandMarkProps = {
  asset: BrandAsset;
  className?: string;
};

export function BrandMark({ asset, className = "" }: BrandMarkProps) {
  return (
    <div className={`brand-mark brand-${asset.theme} ${className}`.trim()}>
      {/*
        Eager loading is intentional: every brand mark declares intrinsic
        dimensions, but lazy decoding still collapses the below-the-fold marks
        (e.g. the Semantica logo) to zero height until scroll, which shifts
        the document by ~44px after the logo loads.
      */}
      <Image alt={asset.alt} height={72} loading="eager" src={asset.src} width={180} />
    </div>
  );
}
