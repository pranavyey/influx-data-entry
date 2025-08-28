import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
// Import shadcn/ui components (replace with actual imports if using shadcn/ui CLI)
import { Button } from '@shadcn/ui/button';
import { Input } from '@shadcn/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

const measurementOptions = ['temp', 'humidity', 'pressure'];
const tagOptions = ['loc', 'room'];
const fieldOptions = ['value', 'count'];

const schema = z.object({
  measurement: z.string().min(1, 'Measurement is required'),
  tags: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  fields: z.array(z.object({ key: z.string(), value: z.string() })).min(1, 'At least one field is required'),
});

type FormData = z.infer<typeof schema>;

function App() {
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      measurement: '',
      tags: [{ key: '', value: '' }],
      fields: [{ key: '', value: '' }],
    },
  });
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({ control, name: 'tags' });
  const { fields: fieldFields, append: appendField, remove: removeField } = useFieldArray({ control, name: 'fields' });
  const [status, setStatus] = React.useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setStatus(null);
    // Build line protocol string
    const tags = (data.tags || []).filter(t => t.key && t.value).map(t => `${t.key}=${t.value}`).join(',');
    const fields = data.fields.filter(f => f.key && f.value).map(f => `${f.key}=${f.value}`).join(',');
    const line = `${data.measurement}${tags ? ',' + tags : ''} ${fields}`;
    try {
      const resp = await fetch('/write-line-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: line,
      });
      if (resp.ok) {
        setStatus('Success!');
      } else {
        const error = await resp.text();
        setStatus('Error: ' + error);
      }
    } catch (err) {
      setStatus('Network error');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>InfluxDB Line Protocol Entry</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Measurement Dropdown */}
        <div style={{ marginBottom: 16 }}>
          <label>Measurement</label>
          <Controller
            control={control}
            name="measurement"
            render={({ field }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Input {...field} placeholder="Select or type measurement" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {measurementOptions.map(opt => (
                    <DropdownMenuItem key={opt} onSelect={() => setValue('measurement', opt)}>{opt}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
          {errors.measurement && <div style={{ color: 'red' }}>{errors.measurement.message}</div>}
        </div>
        {/* Tags */}
        <div style={{ marginBottom: 16 }}>
          <label>Tags</label>
          {tagFields.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <Controller
                control={control}
                name={`tags.${idx}.key` as const}
                render={({ field }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Input {...field} placeholder="Tag key" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {tagOptions.map(opt => (
                        <DropdownMenuItem key={opt} onSelect={() => setValue(`tags.${idx}.key`, opt)}>{opt}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
              <Controller
                control={control}
                name={`tags.${idx}.value` as const}
                render={({ field }) => <Input {...field} placeholder="Tag value" />}
              />
              <Button type="button" onClick={() => removeTag(idx)}>-</Button>
            </div>
          ))}
          <Button type="button" onClick={() => appendTag({ key: '', value: '' })}>Add Tag</Button>
        </div>
        {/* Fields */}
        <div style={{ marginBottom: 16 }}>
          <label>Fields</label>
          {fieldFields.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <Controller
                control={control}
                name={`fields.${idx}.key` as const}
                render={({ field }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Input {...field} placeholder="Field key" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {fieldOptions.map(opt => (
                        <DropdownMenuItem key={opt} onSelect={() => setValue(`fields.${idx}.key`, opt)}>{opt}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
              <Controller
                control={control}
                name={`fields.${idx}.value` as const}
                render={({ field }) => <Input {...field} placeholder="Field value" />}
              />
              <Button type="button" onClick={() => removeField(idx)}>-</Button>
            </div>
          ))}
          <Button type="button" onClick={() => appendField({ key: '', value: '' })}>Add Field</Button>
          {errors.fields && <div style={{ color: 'red' }}>{errors.fields.message}</div>}
        </div>
        <Button type="submit" disabled={isSubmitting}>Submit</Button>
      </form>
      {status && <div style={{ marginTop: 16 }}>{status}</div>}
    </div>
  );
}

export default App;
