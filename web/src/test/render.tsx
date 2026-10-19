import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

type RenderOptions = {
  initialRoute?: string;
};

export const renderWithAppProviders = (
  element: ReactElement,
  { initialRoute = "/" }: RenderOptions = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>{element}</MemoryRouter>
      </QueryClientProvider>,
    ),
  };
};
