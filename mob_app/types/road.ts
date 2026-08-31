import * as DocumentPicker from "expo-document-picker";

export type RetrievalMethod =
  | "auto"
  | "hybrid"
  | "vectorless";

export type QueryRequest = {
  query: string;
  method: RetrievalMethod;
};

export type RoadQueryInput = QueryRequest & {
  file?: DocumentPicker.DocumentPickerAsset;
};

export type QueryResponse = {
  method: string;
  answer: string;
  document: string;
  cost: number;
};
