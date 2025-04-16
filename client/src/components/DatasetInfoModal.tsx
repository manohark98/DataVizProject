import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DatasetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DatasetInfoModal({ isOpen, onClose }: DatasetInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">About This Dataset</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <p className="mb-4">
            This dataset is from a 2014 survey that measures attitudes towards mental health and frequency of mental health disorders in the tech workplace.
          </p>
          <h4 className="font-semibold text-md mb-2">Dataset Contains:</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Family History of Mental Illness: Do you have a family history of mental illness? - Yes or NO</li>
            <li>Company Size: '6-25', 'More than 1000', '26-100', '100-500', '1-5','500-1000'</li>
            <li>Year: 2014, 2016, 2019, 2017, 2018</li>
            <li>Age: Integer value</li>
            <li>Age-Group: '31-40', '41-65', '21-30', '0-20', '66-100'</li>
            <li>Gender: 'Female', 'Male', 'Undecided'</li>
            <li>Sought Treatment: Boolean</li>
            <li>Prefer Anonymity: Boolean</li>
            <li>Rate Reaction to Problems: 'Above Average', 'Below Average'</li>
            <li>Negative Consequences: 'No', 'Maybe', 'Yes', 'Self-Employed'</li>
            <li>Location: Various countries worldwide</li>
            <li>Access to Information: Boolean</li>
            <li>Insurance: Boolean</li>
            <li>Diagnosis: 'Yes', 'No', 'Sometimes'</li>
            <li>Discuss Mental Health Problems: 'Maybe', 'No', 'Yes'</li>
            <li>Responsible Employer: 'Yes', 'No', 'Maybe', 'Self-Employed'</li>
            <li>Disorder: Boolean</li>
            <li>Primarily a Tech Employer: Boolean</li>
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
