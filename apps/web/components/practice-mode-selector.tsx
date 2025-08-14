"use client"

import { Button } from "@workspace/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Badge } from "@workspace/ui/components/badge"
import { chordGroups, getAllChords } from "@/lib/chords"

type PracticeMode = "all" | "group" | "specific"

interface PracticeModeSelectorProps {
    practiceMode: PracticeMode
    selectedGroup: string
    selectedChordNames: string[]
    onPracticeModeChange: (mode: PracticeMode) => void
    onSelectedGroupChange: (group: string) => void
    onChordSelection: (chordName: string, isSelected: boolean) => void
    onSelectAllChords: () => void
    onClearAllChords: () => void
}

export function PracticeModeSelector({
    practiceMode,
    selectedGroup,
    selectedChordNames,
    onPracticeModeChange,
    onSelectedGroupChange,
    onChordSelection,
    onSelectAllChords,
    onClearAllChords
}: PracticeModeSelectorProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Practice Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="practice-mode">Practice Mode</Label>
                    <Select value={practiceMode} onValueChange={onPracticeModeChange}>
                        <SelectTrigger id="practice-mode">
                            <SelectValue placeholder="Select practice mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Chords (Random)</SelectItem>
                            <SelectItem value="group">Chord Group</SelectItem>
                            <SelectItem value="specific">Specific Chord</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {practiceMode === "group" && (
                    <div className="space-y-2">
                        <Label htmlFor="chord-group">Chord Group</Label>
                        <Select value={selectedGroup} onValueChange={onSelectedGroupChange}>
                            <SelectTrigger id="chord-group">
                                <SelectValue placeholder="Select chord group" />
                            </SelectTrigger>
                            <SelectContent>
                                {chordGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {practiceMode === "specific" && (
                    <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <Label>Select Chords ({selectedChordNames.length} selected)</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onSelectAllChords}
                                >
                                    Select All
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onClearAllChords}
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>

                        {/* Selected chords badges */}
                        {selectedChordNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 p-2 bg-white rounded border">
                                {selectedChordNames.map((chordName) => (
                                    <Badge key={chordName} variant="secondary" className="text-xs">
                                        {chordName}
                                        <button
                                            type="button"
                                            className="ml-1 hover:bg-gray-300 rounded"
                                            onClick={() => onChordSelection(chordName, false)}
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Chord selection grid */}
                        <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {getAllChords().map((chord) => (
                                    <div key={chord.name} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`chord-${chord.name}`}
                                            checked={selectedChordNames.includes(chord.name)}
                                            onCheckedChange={(checked) => {
                                                onChordSelection(chord.name, checked === true)
                                            }}
                                        />
                                        <Label
                                            htmlFor={`chord-${chord.name}`}
                                            className="text-sm cursor-pointer"
                                        >
                                            {chord.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {practiceMode === "group" && (
                <div className="text-sm text-gray-600">
                    {chordGroups.find(g => g.id === selectedGroup)?.description}
                    {" "}({chordGroups.find(g => g.id === selectedGroup)?.chords.length} chords)
                </div>
            )}
        </div>
    )
}
