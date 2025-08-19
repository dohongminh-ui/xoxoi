// PIXI is loaded via CDN in index.html; provide minimal-but-useful typings for the parts we use

declare namespace PIXI {
   interface PointLike {
      x: number;
      y: number;
   }

   interface Ticker {
      add(cb: (delta?: number) => void): void;
      remove(cb: (delta?: number) => void): void;
   }

   interface ScreenLike {
      width: number;
      height: number;
   }

   interface InteractionDataLike {
      getLocalPosition(container: Container | Stage): PointLike;
   }

   interface InteractionEventLike {
      data: InteractionDataLike;
   }

   interface InteractionPluginLike {
      mouse?: {global?: PointLike};
   }

   interface RendererLike {
      plugins?: {interaction?: InteractionPluginLike};
      events?: {pointer?: PointLike};
      resize?(width: number, height: number): void;
   }

   class DisplayObject {
      x: number;
      y: number;
      destroy?(options?: any): void;
   }

   class Container extends DisplayObject {
      scale: {x: number; y: number; set(xy: number): void};
      children: any[];
      interactive?: boolean;
      hitArea?: any;
      addChild(child: any): void;
      removeChild(child: any): void;
      on(event: string, cb: (...args: any[]) => void): void;
      off(event: string, cb: (...args: any[]) => void): void;
   }

   class Stage extends Container {}

   class Graphics extends DisplayObject {
      // Custom flags we attach in code
      isWinningLine?: boolean;
      isPlayerMark?: boolean;
      isHighlight?: boolean;

      clear(): void;
      lineStyle(
         widthOrOptions:
            | number
            | {width: number; color: number; cap?: string; join?: string; alpha?: number},
         color?: number,
         alpha?: number
      ): void;
      moveTo(x: number, y: number): void;
      lineTo(x: number, y: number): void;
      beginFill(color: number, alpha?: number): void;
      drawRect(x: number, y: number, width: number, height: number): void;
      endFill(): void;
   }

   class Text extends DisplayObject {
      constructor(text: string, style?: Record<string, any>);
      width: number;
      height: number;
      anchor: {set(xy: number): void};
      scale: {set(xy: number): void};
      isPlayerMark?: boolean;
   }

   class Application<TOptions = any> {
      constructor(options?: TOptions);
      view: HTMLCanvasElement;
      stage: Stage | Container;
      screen: ScreenLike;
      renderer: RendererLike;
      ticker: Ticker;
      destroy(removeView?: boolean): void;
   }
}

declare const PIXI: typeof PIXI;
