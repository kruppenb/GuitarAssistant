'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Tab } from '../../models/Tab';
import { TabRenderer } from '../../rendering/TabRenderer';
import { ScrollController } from '../../playback/ScrollController';
import { useScreenWakeLock } from '../../playback/useScreenWakeLock';

interface TabViewerProps {
  tab: Tab;
}

export const TabViewer: React.FC<TabViewerProps> = ({ tab }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<TabRenderer | null>(null);
  const controllerRef = useRef<ScrollController | null>(null);
  
  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const screenNotice = useScreenWakeLock(isPlaying);
  
  // Initialize renderer and controller
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // Set canvas size
    const updateSize = () => {
      if (container && canvas) {
        canvas.width = container.clientWidth;
        canvas.height = 300;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Create renderer and controller
    rendererRef.current = new TabRenderer(canvas);
    controllerRef.current = new ScrollController(tab.tempo, tab.timeSignature, tab.measures.length);
    setIsPlaying(false);
    
    controllerRef.current.setPositionChangeCallback((pos) => {
      setPosition(pos);
      rendererRef.current?.render(tab, pos);
    });
    
    controllerRef.current.setCompleteCallback(() => {
      setIsPlaying(false);
    });
    
    // Initial render
    rendererRef.current.render(tab, 0);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      controllerRef.current?.destroy();
    };
  }, [tab]);
  
  const handlePlayPause = () => {
    if (!controllerRef.current) return;
    
    if (isPlaying) {
      controllerRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      controllerRef.current.play();
    }
  };
  
  const handleStop = () => {
    if (!controllerRef.current) return;
    controllerRef.current.stop();
    setIsPlaying(false);
    setPosition(0);
  };
  
  const handleSpeedChange = (newSpeed: number) => {
    controllerRef.current?.setSpeed(newSpeed);
    setSpeed(newSpeed);
  };
  
  const handlePositionChange = (newPosition: number) => {
    controllerRef.current?.setPosition(newPosition);
  };
  
  return (
    <div className="tab-viewer">
      <div ref={containerRef} className="canvas-container">
        <canvas ref={canvasRef} />
      </div>
      
      <div className="controls">
        <div className="control-row">
          <button onClick={handleStop} className="control-btn" title="Stop">
            ⏹️
          </button>
          <button onClick={handlePlayPause} className="control-btn play-btn" title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="speed-control">
            <label>Speed: {(speed * 100).toFixed(0)}%</label>
            <input
              type="range"
              min={0.25}
              max={2.0}
              step={0.25}
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            />
            <div className="speed-marks">
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
              <span>150%</span>
              <span>200%</span>
            </div>
          </div>
        </div>
        
        {screenNotice && <p role="status">{screenNotice}</p>}

        <div className="position-control">
          <label>Position: Measure {Math.floor(position) + 1} / {tab.measures.length}</label>
          <input
            type="range"
            min={0}
            max={tab.measures.length - 1}
            step={0.01}
            value={position}
            onChange={(e) => handlePositionChange(parseFloat(e.target.value))}
          />
        </div>
        
        <div className="info">
          <span>🎵 {tab.title} - {tab.artist}</span>
          <span>🎸 {tab.tuning.strings.join('-')}</span>
          <span>⏱️ {tab.tempo} BPM</span>
        </div>
      </div>
    </div>
  );
};
