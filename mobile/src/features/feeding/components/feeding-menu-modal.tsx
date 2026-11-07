import { FlatList, Modal, Pressable, Text, View } from "react-native";

interface FeedingMenuModalProps {
  visible: boolean;
  foodMenuOptions: string[];
  selectedFood: string;
  onClose: () => void;
  onSelectFood: (food: string) => void;
}

export function FeedingMenuModal({
  visible,
  foodMenuOptions,
  selectedFood,
  onClose,
  onSelectFood,
}: FeedingMenuModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end bg-black/50"
        accessibilityViewIsModal
        accessibilityLabel="Food menu options"
      >
        <View className="rounded-t-3xl bg-white">
          <View className="border-b border-gray-200 p-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-gray-800">
                Select Food Menu
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close food menu"
                className="min-h-12 justify-center px-2 active:opacity-80"
              >
                <Text className="text-lg font-semibold text-teal-600">
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
          <View className="max-h-96">
            <FlatList
              data={foodMenuOptions}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item: food }) => (
                <Pressable
                  onPress={() => {
                    onSelectFood(food);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${food}`}
                  accessibilityState={{ selected: selectedFood === food }}
                  className={`border-b px-6 py-4 active:bg-gray-50 ${
                    selectedFood === food
                      ? "border-teal-100 bg-teal-50"
                      : "border-gray-100"
                  }`}
                >
                  <Text
                    className={`text-lg ${
                      selectedFood === food
                        ? "font-semibold text-teal-700"
                        : "text-gray-800"
                    }`}
                  >
                    {food}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

