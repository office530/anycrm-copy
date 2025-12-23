import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSettings } from "@/components/context/SettingsContext";

export default function GalaxyScene({ opportunities }) {
    const mountRef = useRef(null);
    const { theme } = useSettings();
    const navigate = useNavigate();
    const [hoveredOpp, setHoveredOpp] = useState(null);
    const mouse = useRef(new THREE.Vector2());
    const raycaster = useRef(new THREE.Raycaster());
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const planetsRef = useRef([]);

    // Configuration
    const MIN_RADIUS = 20;
    const MAX_RADIUS = 80;
    
    // Helper to get color by stage
    const getPlanetColor = (stage) => {
        if (stage.includes('Won')) return 0x10B981; // Emerald
        if (stage.includes('Lost')) return 0x64748B; // Slate
        if (stage.includes('New')) return 0x3B82F6; // Blue
        if (stage.includes('Negotiation')) return 0xF59E0B; // Amber
        return 0x8B5CF6; // Purple (Default/Middle)
    };

    // Helper to get size by amount (normalized)
    const getPlanetSize = (amount) => {
        const base = 1.5;
        if (!amount) return base;
        // Logarithmic scale for better visual distribution
        return base + Math.log10(amount + 1) * 0.8;
    };

    useEffect(() => {
        if (!mountRef.current) return;

        // 1. Setup Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.fog = new THREE.FogExp2(theme === 'dark' ? 0x0B1121 : 0x000000, 0.002);

        // 2. Camera
        const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 40, 90);
        cameraRef.current = camera;

        // 3. Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        // 4. Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 200;
        controls.minDistance = 20;

        // 5. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const sunLight = new THREE.PointLight(0xffaa00, 2, 300);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);
        
        // Sun Mesh (The "Core")
        const sunGeo = new THREE.SphereGeometry(8, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        // Add glow effect simply via sprite or just multiple meshes? Keep it simple for now.
        scene.add(sun);


        // 6. Stars Background
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 2000;
        const posArray = new Float32Array(starsCount * 3);
        
        for(let i = 0; i < starsCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 400; 
        }
        
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMat = new THREE.PointsMaterial({
            size: 0.5,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
        });
        const starsMesh = new THREE.Points(starsGeo, starsMat);
        scene.add(starsMesh);


        // 7. Planet Generation
        planetsRef.current = [];
        
        opportunities.forEach((opp, i) => {
            const size = getPlanetSize(opp.amount || opp.loan_amount_requested);
            const color = getPlanetColor(opp.deal_stage);
            
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.4,
                metalness: 0.3,
                emissive: color,
                emissiveIntensity: 0.2
            });
            const planet = new THREE.Mesh(geometry, material);

            // Orbit logic
            const angle = (i / opportunities.length) * Math.PI * 2 + (Math.random() * 0.5); // Spread them out
            const radius = MIN_RADIUS + (Math.random() * (MAX_RADIUS - MIN_RADIUS)); // Random distance
            
            planet.userData = { 
                opp, 
                angle, 
                radius, 
                speed: 0.001 + (Math.random() * 0.002), // Random orbital speed
                originalScale: 1
            };

            planet.position.x = Math.cos(angle) * radius;
            planet.position.z = Math.sin(angle) * radius;
            // Add slight Y variation for "3D" feel
            planet.position.y = (Math.random() - 0.5) * 10;

            scene.add(planet);
            planetsRef.current.push(planet);
            
            // Add a subtle ring/orbit line for each? Too expensive visually maybe.
        });


        // 8. Event Listeners
        const onMouseMove = (event) => {
            // Calculate mouse position in normalized device coordinates (-1 to +1) based on canvas size
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const onClick = () => {
            if (hoveredOpp) {
                // Navigate or open modal
                // For now, we'll let the React overlay handle the "View" button, 
                // but clicking the planet itself could also trigger it.
                // navigate(`${createPageUrl('Opportunities')}?opportunityId=${hoveredOpp.id}`);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('click', onClick);

        // 9. Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate planets
            planetsRef.current.forEach(planet => {
                planet.userData.angle += planet.userData.speed;
                planet.position.x = Math.cos(planet.userData.angle) * planet.userData.radius;
                planet.position.z = Math.sin(planet.userData.angle) * planet.userData.radius;
                planet.rotation.y += 0.01;
            });

            // Rotate stars slowly
            starsMesh.rotation.y += 0.0002;

            // Raycaster logic
            raycaster.current.setFromCamera(mouse.current, camera);
            const intersects = raycaster.current.intersectObjects(planetsRef.current);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (hoveredOpp?.id !== object.userData.opp.id) {
                    setHoveredOpp(object.userData.opp);
                    document.body.style.cursor = 'pointer';
                    
                    // Highlight effect
                    object.material.emissiveIntensity = 0.8;
                    object.scale.set(1.2, 1.2, 1.2);
                }
            } else {
                if (hoveredOpp) {
                    setHoveredOpp(null);
                    document.body.style.cursor = 'default';
                    
                    // Reset all
                    planetsRef.current.forEach(p => {
                        p.material.emissiveIntensity = 0.2;
                        p.scale.set(1, 1, 1);
                    });
                }
            }

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('click', onClick);
            mountRef.current?.removeChild(renderer.domElement);
            // Dispose geometries/materials to avoid leaks
            sunGeo.dispose(); sunMat.dispose();
            starsGeo.dispose(); starsMat.dispose();
        };

    }, [opportunities, theme]); // Re-run if data changes hard (or we could optimize to update positions)

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="w-full h-full" />
            
            {/* HUD / Overlay */}
            {hoveredOpp && (
                <div className="absolute bottom-10 left-10 p-6 rounded-2xl backdrop-blur-xl bg-black/40 border border-white/10 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 max-w-sm pointer-events-none select-none">
                    <h2 className="text-2xl font-bold mb-1">{hoveredOpp.lead_name || 'Opportunity'}</h2>
                    <p className="text-emerald-400 font-mono text-lg mb-2">
                        {hoveredOpp.amount ? `$${hoveredOpp.amount.toLocaleString()}` : (hoveredOpp.loan_amount_requested ? `₪${hoveredOpp.loan_amount_requested.toLocaleString()}` : 'No Amount')}
                    </p>
                    <div className="flex gap-2 mb-3">
                        <span className="px-2 py-1 rounded bg-white/10 text-xs">{hoveredOpp.deal_stage}</span>
                        <span className="px-2 py-1 rounded bg-white/10 text-xs">{hoveredOpp.product_type}</span>
                    </div>
                    <p className="text-white/60 text-sm line-clamp-2">{hoveredOpp.notes || 'No additional notes.'}</p>
                </div>
            )}
            
            <div className="absolute top-6 left-6 pointer-events-none">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 tracking-tight" style={{ textShadow: '0 0 30px rgba(255, 200, 0, 0.3)' }}>
                    SALES GALAXY
                </h1>
                <p className="text-white/50 text-sm mt-1 font-mono tracking-widest uppercase">Pipeline Visualization System v1.0</p>
            </div>

            <div className="absolute bottom-6 right-6 text-white/30 text-xs font-mono">
                <p>Orbit: Rotate</p>
                <p>Scroll: Zoom</p>
                <p>Click: Details</p>
            </div>
        </div>
    );
}