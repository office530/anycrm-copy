import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function usePermissions() {
    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUserPermissions'],
        queryFn: () => base44.auth.me(),
        staleTime: 1000 * 60 * 5,
        retry: false
    });

    // Logic:
    // 1. Admin role (built-in) always has full access.
    // 2. Editor access_level has edit rights.
    // 3. Everyone else (including undefined access_level) is a Viewer.
    
    const isAdmin = user?.role === 'admin';
    const isEditor = isAdmin || user?.access_level === 'editor';
    const isViewer = !isEditor;

    return {
        user,
        isLoading,
        isAdmin,
        isEditor,
        isViewer,
        canEdit: isEditor,
        canCreate: isEditor,
        canDelete: isEditor,
        canManageUsers: isAdmin
    };
}