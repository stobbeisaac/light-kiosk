import { Button } from "@heroui/button";
import type { LightKey } from "@/types/lights";
import { LIGHTS } from "@/lib/constants";

type BrightnessModalProps = {
  isOpen: boolean;
  lightKey: LightKey | null;
  brightness: number;
  onClose: () => void;
  onChange: (value: number) => void;
};

export function BrightnessModal({ isOpen, lightKey, brightness, onClose, onChange }: BrightnessModalProps) {
  if (!isOpen || !lightKey) return null;

  const light = LIGHTS.find((l) => l.key === lightKey);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-w-sm w-[90%] rounded-lg bg-content1 p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brightness-dialog-title"
      >
        <div className="flex items-center justify-between mb-3">
          <p id="brightness-dialog-title" className="text-sm font-semibold">
            {light?.label} Brightness
          </p>
          <Button size="sm" variant="flat" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="brightness-slider"
            name="brightness"
            type="range"
            min={0}
            max={254}
            value={brightness}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-labelledby="brightness-dialog-title"
          />
        </div>
      </div>
    </div>
  );
}
