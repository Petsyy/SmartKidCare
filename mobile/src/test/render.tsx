import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";

export const renderWithQueryClient = async (element: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...(await render(
      <QueryClientProvider client={queryClient}>
        {element}
      </QueryClientProvider>,
    )),
  };
};
