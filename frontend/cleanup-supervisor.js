
const fs = require('fs');

const path = 'src/components/SupervisorManagementModal.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Add React Query imports
if (!content.includes('@tanstack/react-query')) {
    content = content.replace(
        import { Ionicons } from '@expo/vector-icons';,
        import { Ionicons } from '@expo/vector-icons';\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
    );
}

// Replace local state with query
content = content.replace(
  /const \[supervisors, setSupervisors\] = useState<SupervisorUser\[\]>\(\[\]\);\s*const \[isLoading, setIsLoading\] = useState\(false\);/,
  const queryClient = useQueryClient();
  const { data: supervisors = [], isLoading, refetch: fetchSupervisors } = useQuery({
    queryKey: ['my-supervisors'],
    queryFn: async () => {
      const res = await apiClient.get<SupervisorUser[]>('/users/my-supervisors');
      return res.data;
    },
    enabled: visible,
  });
);

// Remove fetchSupervisors manual function
content = content.replace(
  /const fetchSupervisors = async \(\) => \{[\s\S]*?\};\s*useEffect/m,
  useEffect
);

// Refactor useEffect logic
content = content.replace(
  /useEffect\(\(\) => \{\s*if \(visible\) \{\s*fetchSupervisors\(\);\s*setCreatedInfo/m,
  useEffect(() => {
    if (visible) {
      setCreatedInfo
);

// Use Mutation for creation
content = content.replace(
  /const res = await apiClient\.post[\s\S]*?firebaseIdToken: idToken,\s*\S+\);/m,
  const res = await addSupervisorMutation.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
        password: pin.trim() || undefined,
        permissions: selectedPerms,
        firebaseIdToken: idToken,
      });
);

// We need to insert the mutation definitions right after states!
const mutationBlock = 
  const addSupervisorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post<{ supervisor: SupervisorUser; tempPassword: string }>('/users/my-supervisors', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supervisors'] });
    }
  });

  const deleteSupervisorMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(\/users/my-supervisors/\\);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supervisors'] });
    }
  });
;

content = content.replace(
  /const \[createdInfo, setCreatedInfo\] = useState[\s\S]*?null\);/,
  \const [createdInfo, setCreatedInfo] = useState<{ supervisor: SupervisorUser; tempPassword: string } | null>(null);
  \\
);

// Refactor handleVerifyOtpAndCreate isSubmitting
content = content.replace(
  /setIsSubmitting\(true\);\s*setOtpError\(null\);/g,
  setIsSubmitting(true);
    setOtpError(null);
);

// Refactor handleDeleteSupervisor
content = content.replace(
  /const doDelete = async \(\) => \{\s*try \{\s*await apiClient\.delete\(\\/users\/my-supervisors\/\$\{id\}\\);\s*fetchSupervisors\(\);\s*\} catch \(err: any\) \{\s*alert\('Failed to remove supervisor\.'\);\s*\}\s*\};/m,
  const doDelete = async () => {
      try {
        await deleteSupervisorMutation.mutateAsync(id);
      } catch (err: any) {
        alert('Failed to remove supervisor.');
      }
    };
);

fs.writeFileSync(path, content);
console.log('Refactored SupervisorManagementModal');

