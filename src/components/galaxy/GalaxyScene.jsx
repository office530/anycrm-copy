import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from 'react-router-dom';
import { useSettings } from "@/components/context/SettingsContext";
import { differenceInDays } from 'date-fns';

export default function GalaxyScene({ opportunities }) {
    const mountRef = useRef(null);
    const { theme, pipelineStages } = useSettings();
    const [hoveredOpp, setHoveredOpp] = useState(null);
    const mouse = useRef(new THREE.Vector2());
    const raycaster = useRef(new THREE.Raycaster());
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const planetsRef = useRef([]);

    // --- Logic Configuration ---

    // 1. Separate Data
    const { activeDeals, wonDeals, lostDeals, totalWonAmount } = useMemo(() => {
        const active = [];
        const won = [];
        const lost = [];
        let wonAmount = 0;

        opportunities.forEach(opp => {
            if (opp.deal_stage === 'Closed Won') {
                won.push(opp);
                wonAmount += (opp.amount || opp.loan_amount_requested || 0);
            } else if (opp.deal_stage === 'Closed Lost') {
                lost.push(opp);
            } else {
                active.push(opp);
            }
        });

        return { activeDeals: active, wonDeals: won, lostDeals: lost, totalWonAmount: wonAmount };
    }, [opportunities]);

    // 2. Sun Size Logic (Dynamic)
    const sunBaseRadius = 10;
    // Logarithmic growth so it doesn't get too massive too fast
    // Every $100k adds a bit, cap at some reasonable max scale (e.g. 3x)
    const sunScaleFactor = useMemo(() => {
        if (totalWonAmount === 0) return 1;
        // Example: $1M = log10(1,000,000) = 6. 
        // Base scale 1. 
        // Let's say max scale is 5.
        const logValue = Math.log10(totalWonAmount + 1);
        // Map log 0-7 (10M) to scale 1-4
        return 1 + (logValue * 0.4); 
    }, [totalWonAmount]);


    // 3. Orbit Zones for Active Deals
    const activeStages = useMemo(() => {
        return pipelineStages.filter(s => s.id !== 'Closed Won' && s.id !== 'Closed Lost');
    }, [pipelineStages]);

    const getStageConfig = (stageId) => {
        const index = activeStages.findIndex(s => s.id === stageId);
        if (index === -1) return { radius: 100 }; // Default outer

        // Distribute active stages.
        // Index 0 (New) -> Far
        // Index Last (Negotiation) -> Close to Sun
        const totalActive = activeStages.length;
        const invertedIndex = totalActive - 1 - index; 
        
        // Sun is at 0. Sun radius varies. 
        // Min orbit should be sunRadius * scale + buffer.
        const sunRealRadius = sunBaseRadius * sunScaleFactor;
        const minOrbit = sunRealRadius + 20;
        const maxOrbit = minOrbit + 80; // Band width

        const step = (maxOrbit - minOrbit) / Math.max(totalActive - 1, 1);
        const radius = minOrbit + (invertedIndex * step);
        
        return { radius };
    };

    const getHexColor = (stageId) => {
        const stage = pipelineStages.find(s => s.id === stageId);
        if (!stage) return 0xFFFFFF;
        if (stage.label.includes('New')) return 0x60A5FA; 
        if (stage.label.includes('Discovery')) return 0x818CF8;
        if (stage.label.includes('Proposal')) return 0xC084FC;
        if (stage.label.includes('Negotiation')) return 0xFBBF24;
        return 0xCBD5E1;
    };

    const getOrbitalSpeed = (updatedDate) => {
        if (!updatedDate) return 0.002;
        const days = differenceInDays(new Date(), new Date(updatedDate));
        if (days < 7) return 0.008; // Fast
        if (days < 30) return 0.003;
        return 0.0005; // Slow/Stagnant
    };

    // --- Scene Setup ---

    useEffect(() => {
        if (!mountRef.current) return;

        // Setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.fog = new THREE.FogExp2(0x000000, 0.001); // Dark space

        const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 3000);
        camera.position.set(0, 80, 200);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 600;
        controls.minDistance = 50;
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);
        
        // Sun Light (Center)
        const sunLight = new THREE.PointLight(0xFFD700, 2, 500);
        scene.add(sunLight);

        // --- 1. THE SUN (Closed Won) ---
        // Represents Closed Won. Grows with wonDeals.
        const sunGeo = new THREE.SphereGeometry(sunBaseRadius, 64, 64);
        // Emissive yellow/gold
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFAA00 });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.scale.set(sunScaleFactor, sunScaleFactor, sunScaleFactor);
        scene.add(sun);

        // Sun Corona/Glow
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 200, 0, 1)');
        grad.addColorStop(0.3, 'rgba(255, 100, 0, 0.5)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
        const sunGlow = new THREE.Sprite(spriteMat);
        const glowScale = sunBaseRadius * sunScaleFactor * 6; // Glow scales with sun
        sunGlow.scale.set(glowScale, glowScale, 1);
        scene.add(sunGlow);

        // --- 2. THE BLACK HOLE (Closed Lost) ---
        // Fixed size, near the system but distinct.
        // Let's place it at x: 200, z: -100
        const bhPosition = new THREE.Vector3(200, 0, -100);
        
        // Event Horizon (Black Sphere)
        const bhGeo = new THREE.SphereGeometry(15, 32, 32);
        const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const blackHole = new THREE.Mesh(bhGeo, bhMat);
        blackHole.position.copy(bhPosition);
        scene.add(blackHole);

        // Accretion Disk (Swirl around black hole)
        const diskGeo = new THREE.RingGeometry(20, 45, 64);
        // Texture or gradient for disk? Simple colors for now.
        const diskMat = new THREE.MeshBasicMaterial({ 
            color: 0x8B5CF6, // Violet
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.position.copy(bhPosition);
        disk.rotation.x = Math.PI / 1.8; // Tilted
        scene.add(disk);

        // Black Hole Light (Negative light? No, just purple glow)
        const bhLight = new THREE.PointLight(0x8B5CF6, 2, 200);
        bhLight.position.copy(bhPosition);
        scene.add(bhLight);

        // Debris / Lost Souls (optional visual of lost deals orbiting BH?)
        // User said "represent the close lost - his size never changes". 
        // We'll just add some static debris to make it look active.
        const debrisCount = 100;
        const debrisGeo = new THREE.BufferGeometry();
        const debrisPos = new Float32Array(debrisCount * 3);
        for(let i=0; i<debrisCount*3; i+=3) {
            const angle = Math.random() * Math.PI * 2;
            const r = 22 + Math.random() * 20;
            debrisPos[i] = bhPosition.x + Math.cos(angle) * r;
            debrisPos[i+1] = bhPosition.y + (Math.random() - 0.5) * 2; // Flat disk
            debrisPos[i+2] = bhPosition.z + Math.sin(angle) * r;
        }
        debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPos, 3));
        const debrisMat = new THREE.PointsMaterial({ color: 0x6D28D9, size: 0.5 });
        const debris = new THREE.Points(debrisGeo, debrisMat);
        // We need to tilt debris to match disk manually or put in group.
        // Easier: Put BH in a Group.
        const bhGroup = new THREE.Group();
        bhGroup.add(blackHole);
        bhGroup.add(disk);
        // Re-generate local debris
        const localDebrisPos = new Float32Array(debrisCount * 3);
        for(let i=0; i<debrisCount*3; i+=3) {
            const angle = Math.random() * Math.PI * 2;
            const r = 22 + Math.random() * 20;
            localDebrisPos[i] = Math.cos(angle) * r;
            localDebrisPos[i+1] = (Math.random() - 0.5) * 1; 
            localDebrisPos[i+2] = Math.sin(angle) * r;
        }
        debrisGeo.setAttribute('position', new THREE.BufferAttribute(localDebrisPos, 3));
        const debrisMesh = new THREE.Points(debrisGeo, debrisMat);
        
        bhGroup.add(debrisMesh);
        bhGroup.position.copy(bhPosition);
        bhGroup.rotation.x = Math.PI / 6; // Tilt the whole system
        scene.add(bhGroup);


        // --- 3. ACTIVE PLANETS (Deals) ---
        planetsRef.current = [];
        activeDeals.forEach((opp, i) => {
            const config = getStageConfig(opp.deal_stage);
            const color = getHexColor(opp.deal_stage);
            
            // Size
            const value = opp.amount || opp.loan_amount_requested || 0;
            const size = Math.max(1, Math.log10(value + 1) * 1.5);
            
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.7,
                metalness: 0.1,
                emissive: color,
                emissiveIntensity: 0.15
            });
            const planet = new THREE.Mesh(geometry, material);
            
            // Position
            const angle = (i * 137.5) * (Math.PI / 180);
            const variance = (Math.random() - 0.5) * 10;
            const finalRadius = config.radius + variance;
            
            planet.position.x = Math.cos(angle) * finalRadius;
            planet.position.z = Math.sin(angle) * finalRadius;
            planet.position.y = (Math.random() - 0.5) * (finalRadius * 0.15);

            planet.userData = { 
                opp, 
                angle, 
                radius: finalRadius,
                speed: getOrbitalSpeed(opp.updated_date),
                baseY: planet.position.y
            };

            scene.add(planet);
            planetsRef.current.push(planet);
        });

        // --- 4. Background Stars ---
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 4000;
        const posArray = new Float32Array(starsCount * 3);
        for(let i=0; i<starsCount*3; i++) {
            posArray[i] = (Math.random() - 0.5) * 2000;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMat = new THREE.PointsMaterial({ size: 0.8, color: 0xffffff, transparent: true, opacity: 0.6 });
        const stars = new THREE.Points(starsGeo, starsMat);
        scene.add(stars);

        // Interaction
        const onMouseMove = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouseMove);

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate Planets around Sun
            planetsRef.current.forEach(planet => {
                planet.userData.angle += planet.userData.speed;
                planet.position.x = Math.cos(planet.userData.angle) * planet.userData.radius;
                planet.position.z = Math.sin(planet.userData.angle) * planet.userData.radius;
                planet.position.y = planet.userData.baseY + Math.sin(Date.now() * 0.001 + planet.userData.angle) * 1;
                planet.rotation.y += 0.01;
            });

            // Rotate Black Hole Accretion Disk
            if (disk) disk.rotation.z -= 0.02;
            if (debrisMesh) debrisMesh.rotation.y -= 0.005;

            // Sun Activity
            sun.rotation.y += 0.002;
            // Pulse glow
            const scalePulse = glowScale + Math.sin(Date.now() * 0.001) * (glowScale * 0.05);
            sunGlow.scale.set(scalePulse, scalePulse, 1);
            sunGlow.lookAt(camera.position); // Always face camera

            // Raycasting
            raycaster.current.setFromCamera(mouse.current, camera);
            const intersects = raycaster.current.intersectObjects(planetsRef.current);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (hoveredOpp?.id !== object.userData.opp.id) {
                    setHoveredOpp(object.userData.opp);
                    document.body.style.cursor = 'pointer';
                    object.material.emissiveIntensity = 0.8;
                }
            } else {
                if (hoveredOpp) {
                    setHoveredOpp(null);
                    document.body.style.cursor = 'default';
                    planetsRef.current.forEach(p => p.material.emissiveIntensity = 0.15);
                }
            }

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
            sunGeo.dispose(); sunMat.dispose();
        };

    }, [activeDeals, wonDeals, lostDeals, totalWonAmount, theme, activeStages, sunScaleFactor]);

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="w-full h-full" />
            
            {/* Legend */}
            <div className="absolute bottom-6 left-6 pointer-events-none space-y-4">
                 <div className="space-y-1">
                     <div className="text-white/40 text-[10px] font-mono uppercase mb-1">System Key</div>
                     <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#F59E0B]"></div>
                         <span className="text-white/60 text-xs font-mono">Sun (Won Deals: ${totalWonAmount.toLocaleString()})</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-black border border-purple-500 shadow-[0_0_10px_#8B5CF6]"></div>
                         <span className="text-white/60 text-xs font-mono">Black Hole (Lost: {lostDeals.length})</span>
                     </div>
                 </div>
            </div>

            {/* Hover Card */}
            {hoveredOpp && (
                <div className="absolute top-20 right-6 pointer-events-none z-20">
                    <div className="bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl min-w-[280px] animate-in slide-in-from-right-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-500/10">{hoveredOpp.deal_stage}</span>
                            <span className="text-[10px] text-slate-500">{new Date(hoveredOpp.created_date).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1">{hoveredOpp.lead_name}</h3>
                        <p className="text-sm text-slate-400 mb-3">{hoveredOpp.product_type}</p>
                        
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-mono text-amber-400 font-bold">
                                {hoveredOpp.amount ? `$${hoveredOpp.amount.toLocaleString()}` : (hoveredOpp.loan_amount_requested ? `₪${hoveredOpp.loan_amount_requested.toLocaleString()}` : 'N/A')}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="absolute top-6 left-6 pointer-events-none">
                <h1 className="text-6xl font-black text-white tracking-tighter" style={{ textShadow: '0 0 40px rgba(255, 200, 0, 0.4)' }}>
                    GALAXY
                </h1>
                <p className="text-white/40 text-sm font-mono tracking-widest uppercase ml-1">
                    System Mass: ${(totalWonAmount + activeDeals.reduce((a,b) => a + (b.amount||0), 0)).toLocaleString()}
                </p>
            </div>
        </div>
    );
}