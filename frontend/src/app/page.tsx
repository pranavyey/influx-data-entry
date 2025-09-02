"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const measurementOptions = ["temp", "humidity", "pressure"];
const tagOptions = ["loc", "room"];
const fieldOptions = ["value", "count"];

const schema = z.object({
  measurement: z.string().min(1, "Measurement is required"),
  tags: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  fields: z.array(z.object({ key: z.string(), value: z.string() })).min(1, "At least one field is required"),
});

type FormData = z.infer<typeof schema>;

export default function Home() {
  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      measurement: measurementOptions[0],
      tags: [{ key: tagOptions[0], value: "" }],
      fields: [{ key: fieldOptions[0], value: "" }],
    },
  });
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({ control, name: "tags" });
  const { fields: fieldFields, append: appendField, remove: removeField } = useFieldArray({ control, name: "fields" });
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setStatus(null);
    const tags = (data.tags || []).filter(t => t.key && t.value).map(t => `${t.key}=${t.value}`).join(",");
    const fields = data.fields.filter(f => f.key && f.value).map(f => `${f.key}=${f.value}`).join(",");
    const line = `${data.measurement}${tags ? "," + tags : ""} ${fields}`;
    try {
      const resp = await fetch("http://localhost:8000/write-line-protocol", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: line,
      });
      if (resp.ok) {
        setStatus("Success!");
      } else {
        const error = await resp.text();
        setStatus("Error: " + error);
      }
    } catch (err) {
      setStatus("Network error");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 border rounded-lg shadow bg-white dark:bg-zinc-900">
      <h2 className="text-2xl font-bold mb-6">InfluxDB Line Protocol Entry</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Measurement Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Measurement</label>
          <Controller
            control={control}
            name="measurement"
            render={({ field }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    {field.value || "Select measurement"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {measurementOptions.map(opt => (
                    <DropdownMenuItem key={opt} onSelect={() => setValue("measurement", opt)}>{opt}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
          {errors.measurement && <div className="text-red-500 text-sm mt-1">{errors.measurement.message}</div>}
        </div>
        {/* Tags */}
        <div>
          <label className="block mb-1 font-medium">Tags</label>
          <div className="space-y-2">
            {tagFields.map((item, idx) => (
              <div key={item.id} className="flex gap-2 items-center">
                <Controller
                  control={control}
                  name={`tags.${idx}.key` as const}
                  render={({ field }) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="min-w-[90px]">
                          {field.value || "Tag key"}
                        </Button>
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
                  render={({ field }) => <Input {...field} placeholder="Tag value" className="flex-1" />}
                />
                <Button type="button" variant="destructive" onClick={() => removeTag(idx)}>-</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => appendTag({ key: tagOptions[0], value: "" })}>Add Tag</Button>
          </div>
        </div>
        {/* Fields */}
        <div>
          <label className="block mb-1 font-medium">Fields</label>
          <div className="space-y-2">
            {fieldFields.map((item, idx) => (
              <div key={item.id} className="flex gap-2 items-center">
                <Controller
                  control={control}
                  name={`fields.${idx}.key` as const}
                  render={({ field }) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="min-w-[90px]">
                          {field.value || "Field key"}
                        </Button>
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
                  render={({ field }) => <Input {...field} placeholder="Field value" className="flex-1" />}
                />
                <Button type="button" variant="destructive" onClick={() => removeField(idx)}>-</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => appendField({ key: fieldOptions[0], value: "" })}>Add Field</Button>
            {errors.fields && <div className="text-red-500 text-sm mt-1">{errors.fields.message}</div>}
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">Submit</Button>
      </form>
      {status && <div className="mt-4 text-center text-lg">{status}</div>}
    </div>
  );
}
