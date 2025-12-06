'use client'

import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from 'lucide-react'
import * as React from 'react'

import './command.scss'

// Helper to combine class names
function cn(...classes: (false | null | string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// Main Command Component
function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive className={cn('command', className)} {...props} />
}

// Command Input Component
function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="command__input-wrapper">
      <SearchIcon className="command__input-icon" />
      <CommandPrimitive.Input className={cn('command__input', className)} {...props} />
    </div>
  )
}

// Command List Component
function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn('command__list', className)} {...props} />
}

// Command Empty Component
function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="command__empty" {...props} />
}

// Command Group Component
function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group className={cn('command__group', className)} {...props} />
}

// Command Separator Component
function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator className={cn('command__separator', className)} {...props} />
}

// Command Item Component
function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return <CommandPrimitive.Item className={cn('command__item', className)} {...props} />
}

// Command Shortcut Component
function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('command__shortcut', className)} {...props} />
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
}
