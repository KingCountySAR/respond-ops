import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import { Location } from '@shared/api/location'
import { useLocationsContext } from '@web/store/locationsStore'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState } from 'react'

type TextFieldVariant = 'filled' | 'outlined' | 'standard'

export const LocationAutocomplete = observer(({ required, value, variant = 'filled', onChange }: { required?: boolean; value?: Location; variant?: TextFieldVariant; onChange: (location: Location | null) => void }) => {
  const locationsStore = useLocationsContext()

  const [selected, setSelected] = useState<Location | null>(value ?? null)

  const options = useMemo(() => {
    const list = [...locationsStore.locations]
    if (value && !list.some(l => l.id === value.id)) {
      list.unshift(value)
    }
    return list
  }, [locationsStore.locations, value])

  useEffect(() => {
    locationsStore.load()
  }, [locationsStore])

  useEffect(() => {
    setSelected(value ?? null)
  }, [value])

  return new Date().getTime() < 1 ?
    <div>{JSON.stringify(options)}</div>
    :
    <Autocomplete
      options={options}
      onChange={(_event, value) => {
        setSelected(value)
        onChange(value)
      }}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      getOptionLabel={(option) => option.title ?? ''}
      value={selected}
      renderOption={(props, option) => {
        const { key, ...rest } = props
        return (
          <li key={key} {...rest}>
            {option.title}
          </li>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
          label="Location"
          required={required}
          slotProps={{
            ...params.slotProps,

            input: {
              ...params.slotProps?.input,
              endAdornment: (
                <>
                  {locationsStore.loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.slotProps?.input?.endAdornment}
                </>
              ),
            }
          }}
        />
      )}
    />
})
