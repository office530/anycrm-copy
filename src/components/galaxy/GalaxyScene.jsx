import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSettings } from "@/components/context/SettingsContext";
import { differenceInDays } from 'date-fns';

export default function GalaxyScene({ opportunities }) {
    const mountRef = useRef(null);
    const { theme, pipelineStages } = useSettings();
    const navigate = useNavigate();
    const [hoveredOpp, setHoveredOpp] = useState(null);
    const mouse = useRef(new THREE.Vector2());
    const raycaster = useRef(new THREE.Raycaster());
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const planetsRef = useRef([]);
    const ringsRef = useRef([]);

    // --- Logic Configuration ---
    
    // 1. Calculate Orbit Zones based on Pipeline Stages
    // We reverse the stages so "New" is outer and "Won" is inner/Sun
    const activeStages = useMemo(() => {
        // Filter out Closed Lost usually, or put them way out. 
        // Let's treat "Closed Won" as the Sun (radius 0-10)
        // "Closed Lost" as the Outer Rim (radius 150+)
        // The rest are distributed in between.
        return pipelineStages.filter(s => s.id !== 'Closed Won' && s.id !== 'Closed Lost');
    }, [pipelineStages]);

    const getStageConfig = (stageId) => {
        if (stageId === 'Closed Won') return { radius: 0, color: '#10B981' }; // The Sun
        if (stageId === 'Closed Lost') return { radius: 150, color: '#64748B' }; // Outer Rim
        
        const index = activeStages.findIndex(s => s.id === stageId);
        if (index === -1) return { radius: 120, color: '#888888' }; // Unknown

        // Distribute active stages between radius 30 and 100
        // Closer to 0 index = Closer to "New" ? No, usually Stages go New -> Won.
        // So New (index 0) should be FAR (Radius 100)
        // Negotiation (index high) should be CLOSE (Radius 30)
        const totalActive = activeStages.length;
        const invertedIndex = totalActive - 1 - index; // 0 for last stage, N for first stage
        
        // Normalize: New (start) -> 100, End -> 30
        const step = 70 / Math.max(totalActive - 1, 1);
        const radius = 30 + (invertedIndex * step);
        
        // Find color in settings
        const stageSettings = activeStages[index];
        // stageSettings.color is a tailwind class (e.g. bg-blue-400). 
        // We need a hex for THREE.js. Let's map or fallback.
        // Since we can't easily parse tailwind classes to hex in JS without a map, 
        // let's use a hash/lookup or standard colors.
        
        return { radius, label: stageSettings.label };
    };

    // Helper: Map Tailwind-ish names to Hex if needed, or use a generator
    const getHexColor = (stageId) => {
        const stage = pipelineStages.find(s => s.id === stageId);
        // Simple mapping based on common names or just hash string to color
        if (!stage) return 0xFFFFFF;
        if (stage.label.includes('New')) return 0x60A5FA; // Blue 400
        if (stage.label.includes('Discovery')) return 0x818CF8; // Indigo 400
        if (stage.label.includes('Proposal')) return 0xC084FC; // Purple 400
        if (stage.label.includes('Negotiation')) return 0xFBBF24; // Amber 400
        if (stage.label.includes('Won')) return 0x34D399; // Emerald 400
        if (stage.label.includes('Lost')) return 0x94A3B8; // Slate 400
        return 0xCBD5E1;
    };

    const getOrbitalSpeed = (updatedDate) => {
        if (!updatedDate) return 0.002;
        const days = differenceInDays(new Date(), new Date(updatedDate));
        // Fresh (< 7 days) = Fast (0.005)
        // Stale (> 30 days) = Slow (0.0005)
        if (days < 7) return 0.008;
        if (days < 30) return 0.003;
        return 0.0005;
    };

    // --- Scene Setup ---

    useEffect(() => {
        if (!mountRef.current) return;

        // Setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.fog = new THREE.FogExp2(theme === 'dark' ? 0x000000 : 0x050510, 0.0015);

        const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 2000);
        camera.position.set(0, 60, 140);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 400;
        controls.minDistance = 20;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        const sunLight = new THREE.PointLight(0xFFD700, 3, 400);
        scene.add(sunLight);

        // --- The Sun (Closed Won Aggregator) ---
        const sunGeo = new THREE.SphereGeometry(12, 64, 64);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        scene.add(sun);

        // Sun Glow (Sprite)
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 200, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
        const sunGlow = new THREE.Sprite(spriteMat);
        sunGlow.scale.set(60, 60, 1);
        scene.add(sunGlow);

        // --- Orbital Rings (Visual Guides) ---
        ringsRef.current = [];
        activeStages.forEach((stage, idx) => {
            const { radius } = getStageConfig(stage.id);
            const geometry = new THREE.TorusGeometry(radius, 0.3, 16, 100);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.15 
            });
            const ring = new THREE.Mesh(geometry, material);
            ring.rotation.x = Math.PI / 2;
            scene.add(ring);
            ringsRef.current.push(ring);
            
            // Add Label for the Ring (using Canvas Texture on a Sprite)
            // Simplifying for performance: Just rings for now.
        });

        // --- Background Stars ---
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 3000;
        const posArray = new Float32Array(starsCount * 3);
        const colsArray = new Float32Array(starsCount * 3);
        
        for(let i = 0; i < starsCount * 3; i+=3) {
            posArray[i] = (Math.random() - 0.5) * 800;
            posArray[i+1] = (Math.random() - 0.5) * 600;
            posArray[i+2] = (Math.random() - 0.5) * 800;
            // Slight blue/white variations
            colsArray[i] = 0.8 + Math.random() * 0.2;
            colsArray[i+1] = 0.8 + Math.random() * 0.2;
            colsArray[i+2] = 1; 
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(colsArray, 3));
        const starsMat = new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.8 });
        const stars = new THREE.Points(starsGeo, starsMat);
        scene.add(stars);


        // --- Planets (Opportunities) ---
        planetsRef.current = [];
        opportunities.forEach((opp, i) => {
            if (opp.deal_stage === 'Closed Won') return; // Consumed by the sun

            const config = getStageConfig(opp.deal_stage);
            const color = getHexColor(opp.deal_stage);
            
            // Size based on amount
            const value = opp.amount || opp.loan_amount_requested || 0;
            const size = Math.max(1, Math.log10(value + 1) * 1.2);
            
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.7,
                metalness: 0.1,
                emissive: color,
                emissiveIntensity: 0.1
            });
            
            const planet = new THREE.Mesh(geometry, material);
            
            // Initial Position
            const angle = (i * 137.5) * (Math.PI / 180); // Golden angle distribution
            const variance = (Math.random() - 0.5) * 15; // Jitter in radius
            const finalRadius = config.radius + variance;
            
            planet.position.x = Math.cos(angle) * finalRadius;
            planet.position.z = Math.sin(angle) * finalRadius;
            planet.position.y = (Math.random() - 0.5) * (finalRadius * 0.2); // Disc-like distribution

            planet.userData = { 
                opp, 
                angle, 
                radius: finalRadius,
                speed: getOrbitalSpeed(opp.updated_date),
                baseY: planet.position.y
            };

            scene.add(planet);
            planetsRef.current.push(planet);

            // Add value Ring/Moon if very high value?
            if (value > 100000) {
                 const ringGeo = new THREE.TorusGeometry(size + 1, 0.1, 16, 50);
                 const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
                 const ring = new THREE.Mesh(ringGeo, ringMat);
                 ring.rotation.x = Math.PI / 2;
                 planet.add(ring);
            }
        });

        // Event Listeners
        const onMouseMove = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };
        const onClick = () => {
            if (hoveredOpp) {
                // Future: Navigate to detail
            }
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('click', onClick);

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate Planets
            planetsRef.current.forEach(planet => {
                planet.userData.angle += planet.userData.speed;
                planet.position.x = Math.cos(planet.userData.angle) * planet.userData.radius;
                planet.position.z = Math.sin(planet.userData.angle) * planet.userData.radius;
                
                // Bobbing effect
                planet.position.y = planet.userData.baseY + Math.sin(Date.now() * 0.001 + planet.userData.angle * 10) * 1;
                
                planet.rotation.y += 0.01;
            });

            // Rotate Galaxy (Stars)
            stars.rotation.y += 0.0001;

            // Sun pulse
            const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.05;
            sun.scale.set(pulse, pulse, pulse);

            // Raycasting
            raycaster.current.setFromCamera(mouse.current, camera);
            const intersects = raycaster.current.intersectObjects(planetsRef.current);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (hoveredOpp?.id !== object.userData.opp.id) {
                    setHoveredOpp(object.userData.opp);
                    document.body.style.cursor = 'pointer';
                    controls.autoRotate = false; // Pause rotation on hover
                    
                    // Highlight
                    object.material.emissiveIntensity = 0.8;
                }
            } else {
                if (hoveredOpp) {
                    setHoveredOpp(null);
                    document.body.style.cursor = 'default';
                    controls.autoRotate = true;
                    
                    // Reset Highlight
                    planetsRef.current.forEach(p => p.material.emissiveIntensity = 0.1);
                }
            }

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('click', onClick);
            if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
            sunGeo.dispose(); sunMat.dispose();
            starsGeo.dispose(); starsMat.dispose();
        };

    }, [opportunities, theme, activeStages]);

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="w-full h-full" />
            
            {/* Legend / Key */}
            <div className="absolute bottom-6 left-6 pointer-events-none">
                 <div className="space-y-1">
                     {activeStages.map((stage) => {
                         const color = getHexColor(stage.id);
                         return (
                             <div key={stage.id} className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
                                      style={{ backgroundColor: '#' + color.toString(16).padStart(6, '0') }} />
                                 <span className="text-white/60 text-xs font-mono uppercase tracking-widest">{stage.label}</span>
                             </div>
                         );
                     })}
                 </div>
            </div>

            {/* HUD */}
            {hoveredOpp && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-12 pointer-events-none z-20">
                    <div className="flex flex-col items-center gap-2">
                        {/* Connecting Line */}
                        <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/50"></div>
                        
                        <div className="bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl min-w-[240px] text-center transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
                            <div className="text-xs font-mono text-emerald-400 mb-1 uppercase tracking-wider">{hoveredOpp.deal_stage}</div>
                            <div className="text-lg font-bold text-white leading-tight">{hoveredOpp.lead_name}</div>
                            <div className="text-sm text-slate-400 mb-2">{hoveredOpp.product_type}</div>
                            <div className="text-2xl font-mono text-amber-400 font-bold">
                                {hoveredOpp.amount ? `$${hoveredOpp.amount.toLocaleString()}` : (hoveredOpp.loan_amount_requested ? `₪${hoveredOpp.loan_amount_requested.toLocaleString()}` : 'N/A')}
                            </div>
                            {hoveredOpp.updated_date && (
                                <div className="text-[10px] text-slate-500 mt-2">
                                    Last Active: {new Date(hoveredOpp.updated_date).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="absolute top-6 left-6 pointer-events-none">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 tracking-tighter filter drop-shadow-lg" style={{ fontFamily: 'system-ui' }}>
                    GALAXY
                </h1>
                <p className="text-emerald-500/80 text-xs font-mono tracking-[0.3em] uppercase ml-1">Live Pipeline Physics</p>
            </div>
        </div>
    );
}