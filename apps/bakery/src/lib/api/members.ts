"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberRole } from "@repo/sdk/src/index";
import { toast } from "sonner";
import sdk from "@/lib/sdk";

export interface Member {
  id: string;
  name: string;
  email: string;
  username: string;
  role: MemberRole;
  customRoles: string[];
  isActive: boolean;
  image?: string | null;
  lastActive?: string;
  status?: string;
  tags?: string[];
  createdAt: string;
  isBanned?: boolean;
  department: any;
  userId: string;
}

export interface Employee {
  id: string;
  name: string;
  status: "Active" | "Inactive" | "On Leave" | "Terminated";
  gender: "Male" | "Female" | "Other" | "Prefer not to say";
  age: string;
  position: string;
  department: string;
  employeeId: string;
  email: string;
  address: string;
  phone: string;
  createdAt: string;
  tags: string[];
  image?: string;
  dateOfBirth?: string;
}

export interface Attendance {
  month: string;
  onTime: number;
  onLate: number;
}

const paths = {
  list: () => sdk.client.get("/users/members"),
  create: (data: Partial<Member>) => sdk.client.post("/users/members", data),
  get: (memberId: string) => sdk.client.get(`/users/members/${memberId}`),
  update: (memberId: string, data: Partial<Member>) =>
    sdk.client.patch(`/users/members/${memberId}`, data),
  delete: (memberId: string) => sdk.client.delete(`/users/members/${memberId}`),
};

// Members
export const useListMembers = () => {
  const { data, refetch, error, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: paths.list,
  });

  return {
    data: ((data as any)?.members as Member[]) || [],
    isLoading,
    isError: !!error,
    error,
    refetch,
  };
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Member>) => paths.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

export interface CreateInterface {
  name: string;
  email: string;
  phone: string;
  password: string;
  image?: string;
  departmentId?: string;
  documents?: string[];
  role: MemberRole;
}

export const useCreateUserAndMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateInterface) => {
      const data = await paths.create(userData as any);
      return (data as any)?.data || data;
    },
    onSuccess: (data) => {
      console.log("User created successfully", data);
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error: any) => {
      console.error(
        "Error creating user:",
        error.response?.data?.error || error.message,
      );
      toast.error("Error creating user", {
        description: error.response?.data?.error || error.message,
      });
    },
  });
};

export const useUpdateMember = (memberId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Member>) => paths.update(memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => paths.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

export const useGetMember = (memberId: string) => {
  return useQuery({
    queryKey: ["member", memberId],
    queryFn: () => paths.get(memberId),
    enabled: !!memberId,
  });
};

export const useUnbanMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      sdk.client.post(`/users/members/${memberId}/unban`),
    onSuccess: (data: any, memberId) => {
      queryClient.invalidateQueries({
        queryKey: ["members"],
      });
      queryClient.invalidateQueries({
        queryKey: ["member", memberId],
      });

      if (data.meta?.message) {
        console.log(data.meta.message);
      }
    },
    onError: (error: Error) => {
      console.error("Failed to unban member:", error);
    },
  });
};

// 1. Define the input type for the mutation
interface ChangePinPayload {
  memberId: string;
  newPin: string;
}

// 2. Define the API function
const changeMemberPin = async (payload: ChangePinPayload): Promise<Member> => {
  return sdk.client.patch(`/users/members/${payload.memberId}/pin`, {
    pin: payload.newPin,
    memberId: payload.memberId,
  });
};

// 3. Create the TanStack Query mutation hook
export const useChangeMemberPin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeMemberPin,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.setQueryData(["member", data.id], data);
    },
    onError: (error) => {
      console.error("Failed to change member pin:", error);
    },
  });
};
