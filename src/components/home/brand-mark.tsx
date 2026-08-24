import Image from "next/image";

import type { BrandAsset } from "@/content/schema";

type BrandMarkProps = {
  asset: BrandAsset;
  className?: string;
};

export function BrandMark({ asset, className = "" }: BrandMarkProps) {
  return (
    <div className={`brand-mark brand-${asset.theme} ${className}`.trim()}>
      <Image alt={asset.alt} height={72} src={asset.src} width={180} />
    </div>
  );
}