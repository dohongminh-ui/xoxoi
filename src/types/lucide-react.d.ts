declare module 'lucide-react' {
   import * as React from 'react';
   export type IconProps = {
      size?: number | string;
      color?: string;
      strokeWidth?: number | string;
      absoluteStrokeWidth?: boolean;
      className?: string;
   } & React.SVGProps<SVGSVGElement>;

   export const Trophy: React.FC<IconProps>;
   export const Users: React.FC<IconProps>;
   export const Clock: React.FC<IconProps>;
   export const Target: React.FC<IconProps>;
   export const RotateCcw: React.FC<IconProps>;
   export const Home: React.FC<IconProps>;
   export const Share2: React.FC<IconProps>;
   export const Zap: React.FC<IconProps>;
   export const Grid3X3: React.FC<IconProps>;
}
