import { field } from "../ui";
type TaskFiltersProps = {
  filters: {
    q: string;
    priority: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      q: string;
      priority: string;
    }>
  >;
};

export default function TaskFilters({
  filters,
  setFilters,
}: TaskFiltersProps) {
  return (
    <div className="mb-3.5 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_200px]">
      <input
        className={`${field} min-w-0 flex-1`}
        placeholder="Search tasks…"
        value={filters.q}
        onChange={(e) => setFilters({ ...filters, q: e.target.value })}
      />

      <select
        className={`${field} min-w-0 flex-1 lg:max-w-[200px]`}
        value={filters.priority}
        onChange={(e) =>
          setFilters({ ...filters, priority: e.target.value })
        }
      >
        <option value="">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}