import { Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";

type FilePickerProps = {
  onFileSelected: (
    file: DocumentPicker.DocumentPickerAsset
  ) => void;
};

export default function FilePicker({
  onFileSelected,
}: FilePickerProps) {
  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];

    onFileSelected(file);
  };

  return (
    <View className="mt-4">
      <Pressable
        onPress={handlePickFile}
        className="rounded-lg bg-gray-700 p-4"
      >
        <Text className="text-center font-bold text-white">
          Select File
        </Text>
      </Pressable>
    </View>
  );
}

