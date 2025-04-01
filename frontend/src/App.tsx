// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import Router from "./routes/router";

// const queryClient = new QueryClient();

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <Router />
//     </QueryClientProvider>
//   )
// }

// export default App


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Router from "./routes/router";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <Router />
      </DndProvider>
    </QueryClientProvider>
  );
}

export default App;