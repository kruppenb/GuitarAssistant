/**
 * Controls automatic scrolling through the tab
 */
export class ScrollController {
  private isPlaying: boolean = false;
  private currentPosition: number = 0; // in measures (floating point)
  private speed: number = 1.0; // Multiplier (0.25x to 2.0x)
  private tempo: number = 120; // BPM
  private timeSignature: string = '4/4';
  private totalMeasures: number = 0;
  
  private animationFrame: number | null = null;
  private lastTimestamp: number = 0;
  
  private onPositionChange?: (position: number) => void;
  private onComplete?: () => void;
  
  constructor(tempo: number = 120, timeSignature: string = '4/4', totalMeasures: number = 0) {
    this.tempo = tempo;
    this.timeSignature = timeSignature;
    this.totalMeasures = totalMeasures;
  }
  
  public play(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.animate();
  }
  
  public pause(): void {
    this.isPlaying = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  public stop(): void {
    this.pause();
    this.setPosition(0);
  }
  
  public setSpeed(speed: number): void {
    this.speed = Math.max(0.25, Math.min(2.0, speed));
  }
  
  public getSpeed(): number {
    return this.speed;
  }
  
  public setPosition(position: number): void {
    this.currentPosition = Math.max(0, Math.min(this.totalMeasures - 1, position));
    this.onPositionChange?.(this.currentPosition);
  }
  
  public getPosition(): number {
    return this.currentPosition;
  }
  
  public setTempo(tempo: number): void {
    this.tempo = tempo;
  }
  
  public setTotalMeasures(total: number): void {
    this.totalMeasures = total;
  }
  
  public setPositionChangeCallback(callback: (position: number) => void): void {
    this.onPositionChange = callback;
  }
  
  public setCompleteCallback(callback: () => void): void {
    this.onComplete = callback;
  }
  
  private animate = (): void => {
    if (!this.isPlaying) return;
    
    const now = performance.now();
    const deltaTime = (now - this.lastTimestamp) / 1000; // Convert to seconds
    this.lastTimestamp = now;
    
    // Calculate measures per second based on tempo and time signature
    const beatsPerSecond = (this.tempo / 60) * this.speed;
    const beatsPerMeasure = parseInt(this.timeSignature.split('/')[0]);
    const measuresPerSecond = beatsPerSecond / beatsPerMeasure;
    
    // Update position
    this.currentPosition += measuresPerSecond * deltaTime;
    
    // Check if we've reached the end
    if (this.currentPosition >= this.totalMeasures - 0.1) {
      this.currentPosition = this.totalMeasures - 0.1;
      this.pause();
      this.onComplete?.();
    }
    
    this.onPositionChange?.(this.currentPosition);
    
    this.animationFrame = requestAnimationFrame(this.animate);
  };
  
  public destroy(): void {
    this.pause();
    this.onPositionChange = undefined;
    this.onComplete = undefined;
  }
}
