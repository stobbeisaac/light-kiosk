import { Card, CardBody } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import type { LightKey } from "@/types/lights";

type LightCardProps = {
  lightKey: LightKey;
  label: string;
  isOn: boolean;
  onToggle: (value: boolean) => void;
  onBrightnessClick: () => void;
};

export function LightCard({ lightKey, label, isOn, onToggle, onBrightnessClick }: LightCardProps) {
  return (
    <Card className="border border-default-100 bg-content1">
      <CardBody className="flex items-center justify-between gap-2 py-3 px-3">
        <div className="flex items-center gap-2">
          <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">{label}</p>
          <span className="text-default-500 text-xs">{isOn ? "On" : "Off"}</span>
        </div>
        <div className="flex items-center gap-8">
          <Switch
            size="lg"
            className="scale-[1.4]"
            color={isOn ? "success" : "default"}
            isSelected={isOn}
            onValueChange={onToggle}
          >
            {isOn ? "On" : "Off"}
          </Switch>
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onClick={onBrightnessClick}
            aria-label="Adjust brightness"
          >
            <Icon icon="ph:sun-bold" width={18} height={18} />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
