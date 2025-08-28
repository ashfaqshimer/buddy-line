import type { AxiosError } from "axios";

export function extractErrorMessage(error: unknown, fallback: string) {
	const axiosError = error as AxiosError<{ error?: string; errors?: string[] }>;

	if (axiosError.response?.data?.errors) {
		return axiosError.response.data.errors.join(', ');
	}
	if (axiosError.response?.data?.error) {
		return axiosError.response.data.error;
	}
	return fallback;
}
