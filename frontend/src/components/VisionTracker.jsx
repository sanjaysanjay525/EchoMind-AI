import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, User, UserX } from 'lucide-react';

export default function VisionTracker({ videoRef, onMetricsUpdate }) {
  const [metrics, setMetrics] = useState({
    faceDetected: false,
    eyeContactPercentage: 0,
    attentionScore: 0,
    lookingAwayCount: 0,
    faceVisibilityScore: 0,
    headPose: 'Straight'
  });

  const stats = useRef({
    totalFrames: 0,
    faceVisibleFrames: 0,
    eyeContactFrames: 0,
    lookingAwayFrames: 0,
    lookingAwayCount: 0,
    isCurrentlyLookingAway: false,
    totalHeadTilt: 0,
  });

  // Track the latest function reference to avoid stale closures in MediaPipe callback
  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  useEffect(() => {
    onMetricsUpdateRef.current = onMetricsUpdate;
  }, [onMetricsUpdate]);

  useEffect(() => {
    if (!videoRef.current) return;

    let isComponentMounted = true;
    let faceMesh;
    let camera;

    const initMediaPipe = () => {
      if (!window.FaceMesh || !window.Camera) {
        // Retry after 500ms if scripts are still loading
        setTimeout(initMediaPipe, 500);
        return;
      }

      try {
        faceMesh = new window.FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults((results) => {
        if (!isComponentMounted) return;

        stats.current.totalFrames++;
        
        let faceDetected = false;
        let isEyeContact = false;
        let headPose = 'Straight';

        let slouching = false;
        let headTilt = 0;
        let headTiltWarning = false;
        let distance = 'Optimal';
        let distanceWarning = false;

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          faceDetected = true;
          stats.current.faceVisibleFrames++;
          
          const landmarks = results.multiFaceLandmarks[0];
          const nose = landmarks[1];
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          
          const faceWidth = rightEye.x - leftEye.x;
          const noseRelativeX = (nose.x - leftEye.x) / faceWidth;
          
          if (noseRelativeX < 0.4) {
            headPose = 'Right';
          } else if (noseRelativeX > 0.6) {
            headPose = 'Left';
          } else {
            headPose = 'Straight';
            isEyeContact = true;
          }

          if (isEyeContact) {
              stats.current.eyeContactFrames++;
              stats.current.isCurrentlyLookingAway = false;
              stats.current.lookingAwayFrames = 0;
          } else {
              stats.current.lookingAwayFrames++;
              if (stats.current.lookingAwayFrames > 30) {
                  if (!stats.current.isCurrentlyLookingAway) {
                      stats.current.lookingAwayCount++;
                      stats.current.isCurrentlyLookingAway = true;
                  }
              }
          }

          // Posture & Framing checks
          const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
          headTilt = Math.round(eyeAngle);
          stats.current.totalHeadTilt += Math.abs(eyeAngle);
          headTiltWarning = Math.abs(eyeAngle) > 15;
          
          const averageEyeY = (leftEye.y + rightEye.y) / 2;
          slouching = averageEyeY > 0.6; // lower in view vertically
          
          if (faceWidth > 0.45) {
            distance = 'Too Close';
            distanceWarning = true;
          } else if (faceWidth < 0.15) {
            distance = 'Too Far';
            distanceWarning = true;
          }

        } else {
          stats.current.lookingAwayFrames++;
          if (stats.current.lookingAwayFrames > 30) {
              if (!stats.current.isCurrentlyLookingAway) {
                  stats.current.lookingAwayCount++;
                  stats.current.isCurrentlyLookingAway = true;
              }
          }
        }

        if (stats.current.totalFrames % 5 === 0) {
          const visibilityScore = Math.round((stats.current.faceVisibleFrames / stats.current.totalFrames) * 100);
          const eyeContactScore = Math.round((stats.current.eyeContactFrames / stats.current.totalFrames) * 100);
          const attention = Math.round((visibilityScore + eyeContactScore) / 2);
          const avgTilt = stats.current.faceVisibleFrames > 0 ? Math.round(stats.current.totalHeadTilt / stats.current.faceVisibleFrames) : 0;

          const currentMetrics = {
              faceDetected,
              eyeContactPercentage: eyeContactScore,
              attentionScore: attention,
              lookingAwayCount: stats.current.lookingAwayCount,
              faceVisibilityScore: visibilityScore,
              headPose,
              slouching,
              headTilt,
              headTiltWarning,
              distance,
              distanceWarning,
              averageHeadTilt: avgTilt
          };

          setMetrics(currentMetrics);
          if (onMetricsUpdateRef.current) {
            onMetricsUpdateRef.current(currentMetrics);
          }
        }
      });

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (isComponentMounted && videoRef.current) {
            await faceMesh.send({image: videoRef.current});
          }
        },
        width: 640,
        height: 480
      });
      
      camera.start();
    } catch (e) {
      console.error("Error initializing MediaPipe:", e);
    }
  };

  initMediaPipe();

  return () => {
    isComponentMounted = false;
    if (camera) camera.stop();
    if (faceMesh) faceMesh.close();
  };
}, [videoRef]);

  return (
    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
       <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Vision Analytics</h3>
           {metrics.faceDetected ? (
               <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                   <User className="w-3.5 h-3.5" />
                   <span>Face Detected</span>
               </div>
           ) : (
               <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full animate-pulse">
                   <UserX className="w-3.5 h-3.5" />
                   <span>No Face Detected</span>
               </div>
           )}
       </div>
       
       <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 rounded-xl p-3 flex flex-col">
               <span className="text-xs text-gray-400 mb-1">Eye Contact</span>
               <span className="text-lg font-bold text-white">{metrics.eyeContactPercentage}%</span>
               <div className="w-full bg-white/10 h-1.5 rounded-full mt-2">
                   <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{width: `${metrics.eyeContactPercentage}%`}}></div>
               </div>
           </div>
           
           <div className="bg-white/5 rounded-xl p-3 flex flex-col">
               <span className="text-xs text-gray-400 mb-1">Attention</span>
               <span className="text-lg font-bold text-white">{metrics.attentionScore}%</span>
               <div className="w-full bg-white/10 h-1.5 rounded-full mt-2">
                   <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{width: `${metrics.attentionScore}%`}}></div>
               </div>
           </div>
           
           <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-between">
               <span className="text-xs text-gray-400 mb-1">Looking Away</span>
               <div className="flex items-center gap-2">
                   {metrics.lookingAwayCount > 0 ? <EyeOff className="w-4 h-4 text-pink-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                   <span className="text-lg font-bold text-white">{metrics.lookingAwayCount}</span>
               </div>
           </div>
           
           <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-between">
               <span className="text-xs text-gray-400 mb-1">Head Pose</span>
               <span className="text-sm font-bold text-indigo-300 uppercase truncate" title={metrics.headPose}>{metrics.headPose}</span>
           </div>
        </div>

        {/* Posture & Framing warnings */}
        {(metrics.slouching || metrics.headTiltWarning || metrics.distanceWarning || !metrics.faceDetected) && (
            <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Framing & Posture Nudge:</span>
                <div className="flex flex-wrap gap-2">
                    {!metrics.faceDetected && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-1 rounded font-bold animate-pulse">
                            Out of Frame
                        </span>
                    )}
                    {metrics.faceDetected && metrics.slouching && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-bold animate-pulse">
                            Excessive Slouching
                        </span>
                    )}
                    {metrics.faceDetected && metrics.headTiltWarning && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-bold animate-pulse">
                            Head Tilted ({metrics.headTilt}°)
                        </span>
                    )}
                    {metrics.faceDetected && metrics.distanceWarning && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-bold animate-pulse">
                            Distance: {metrics.distance}
                        </span>
                    )}
                </div>
            </div>
        )}
     </div>
   );
 }
