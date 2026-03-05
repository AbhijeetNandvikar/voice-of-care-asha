# React Best Practices

## Component Structure
- One component per file
- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks
- Co-locate related files (Component.tsx, Component.css)

## State Management
- Use useState for local component state
- Use useContext for shared state across components
- Consider Zustand/Redux for complex global state
- Lift state up only when necessary
- Keep state as close to where it's used as possible

```typescript
// Local state
const [isOpen, setIsOpen] = useState(false);

// Derived state (don't store what you can calculate)
const filteredItems = items.filter(item => item.active);
```

## Hooks Best Practices
- Follow Rules of Hooks (top level, not in conditions)
- Use useEffect for side effects only
- Clean up effects (return cleanup function)
- Specify dependencies array correctly
- Extract complex logic into custom hooks

```typescript
useEffect(() => {
    const controller = new AbortController();
    
    fetchData(controller.signal);
    
    return () => controller.abort(); // Cleanup
}, [dependency]);
```

## Props & TypeScript
- Define prop types with TypeScript interfaces
- Use destructuring for props
- Provide default values where appropriate
- Keep prop drilling shallow (max 2-3 levels)

```typescript
interface DataTableProps {
    data: Item[];
    onRowClick?: (item: Item) => void;
    loading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ 
    data, 
    onRowClick, 
    loading = false 
}) => {
    // Component logic
};
```

## Performance Optimization
- Use React.memo() for expensive components
- Use useMemo() for expensive calculations
- Use useCallback() for functions passed as props
- Lazy load routes and heavy components
- Virtualize long lists (react-window, react-virtualized)

```typescript
const MemoizedComponent = React.memo(ExpensiveComponent);

const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

const memoizedCallback = useCallback(() => {
    doSomething(a, b);
}, [a, b]);
```

## API Calls & Data Fetching
- Use axios or fetch with proper error handling
- Create API client with interceptors for auth
- Handle loading, error, and success states
- Cancel requests on component unmount
- Consider React Query or SWR for advanced caching

```typescript
const [data, setData] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/items');
            setData(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
}, []);
```

## Forms
- Use controlled components for form inputs
- Validate on submit, not on every keystroke
- Show validation errors clearly
- Disable submit button during submission
- Consider react-hook-form for complex forms

```typescript
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
    }
    await submitForm(formData);
};
```

## Routing
- Use React Router for navigation
- Implement protected routes for authentication
- Use lazy loading for route components
- Handle 404 and error pages

```typescript
<Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
    </Route>
</Routes>
```

## Styling
- Use CSS Modules or styled-components for scoped styles
- Follow BEM or similar naming convention
- Keep styles co-located with components
- Use CSS variables for theming
- Leverage design system (UX4G in this project)

## Error Handling
- Use Error Boundaries for component errors
- Show user-friendly error messages
- Log errors to monitoring service
- Provide fallback UI for errors

```typescript
class ErrorBoundary extends React.Component {
    state = { hasError: false };
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    
    componentDidCatch(error, errorInfo) {
        logErrorToService(error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return <ErrorFallback />;
        }
        return this.props.children;
    }
}
```

## Accessibility
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Maintain proper heading hierarchy
- Test with screen readers
- Provide alt text for images

```typescript
<button 
    aria-label="Close modal"
    onClick={handleClose}
>
    <CloseIcon />
</button>
```

## Environment Variables
- Prefix with VITE_ for Vite projects
- Never commit secrets
- Provide .env.example
- Access via import.meta.env

```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

## Testing
- Write tests for critical user flows
- Test component behavior, not implementation
- Use React Testing Library
- Mock API calls
- Test accessibility

## Common Pitfalls to Avoid
- Don't mutate state directly
- Don't forget dependency arrays in useEffect
- Don't create components inside components
- Don't use index as key in lists (unless static)
- Don't fetch data in render
- Don't ignore TypeScript errors
