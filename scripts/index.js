//@ts-check
import { world, system, BlockPermutation, Player, ItemStack, Block, EquipmentSlot } from '@minecraft/server';
import { MinecraftBlockTypes, MinecraftItemTypes } from './lib/index.js';

const mossyBlocks = [
    "",
    MinecraftBlockTypes.Cobblestone,
    MinecraftBlockTypes.CobblestoneSlab,
    MinecraftBlockTypes.StoneStairs,
    MinecraftBlockTypes.CobblestoneWall,
    MinecraftBlockTypes.StoneBricks,
    MinecraftBlockTypes.StoneBrickSlab,
    MinecraftBlockTypes.StoneBrickStairs,
    MinecraftBlockTypes.StoneBrickWall,
];

/**
 * 
 * @param {Player} player 
 * @param {ItemStack} itemStack 
 */
const decrementItemStack = function(player, itemStack) {
    if (itemStack.amount > 1) {
        itemStack.amount--;
        player.getComponent("equippable")?.getEquipmentSlot(EquipmentSlot.Mainhand).setItem(itemStack);
    } else {
        player.getComponent("equippable")?.getEquipmentSlot(EquipmentSlot.Mainhand).setItem();
    }
}

/**
 * 
 * @param {Block} block 
 * @param {String} blockType 
 * @param {Record<string, any>} states 
 */
const setBlockPermutation = function(block, blockType, states) {
    block.setPermutation(BlockPermutation.resolve(blockType, states));
}

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    const { block, isFirstEvent, itemStack, player } = ev;

    if (!isFirstEvent) return;

    // 染料
    if (itemStack?.typeId.endsWith("_dye")) {
        const blockColor = block.permutation.getState("color");
        let dyeColor = itemStack?.typeId.replace("minecraft:", "").replace("_dye", "");
        let blockType = "";

        if (dyeColor) {
            if (dyeColor === "light_gray") dyeColor = "silver";

            if (blockColor && blockColor === dyeColor) return;

            if (!block.typeId.includes("shulker_box") && !block.typeId.includes("glass")) {
                ev.cancel = true;
                system.run(()=>{
                    decrementItemStack(player, itemStack);
                });
                
                if (block.typeId.includes("wool")) blockType = MinecraftBlockTypes.WhiteWool;
                else if (block.typeId.includes("carpet")) blockType = MinecraftBlockTypes.WhiteCarpet;
                else if (block.typeId.includes("concrete_powder")) blockType = MinecraftBlockTypes.WhiteConcretePowder;
                else if (block.typeId.includes("concrete")) blockType = MinecraftBlockTypes.WhiteConcrete;
                else if (block.typeId.includes("terracotta")) blockType = MinecraftBlockTypes.WhiteTerracotta;

                system.run(() => {
                    if (blockType.includes("glazed_terracotta")) block.setType(blockType);
                    else setBlockPermutation(block, blockType, { color: dyeColor });
                });
            }

            // シュルカーボックス
            if (block.typeId.includes("shulker_box")) {
                ev.cancel = true;
                blockType = MinecraftBlockTypes.WhiteShulkerBox;
                system.run(()=>{
                    decrementItemStack(player, itemStack);
                    setBlockPermutation(block, blockType, { color: dyeColor });
                });
            }

            // ガラス系
            if (block.typeId.includes("glass_pane") || block.typeId.includes("glass")) {
                blockType = block.typeId.includes("glass_pane") ? MinecraftBlockTypes.WhiteStainedGlassPane : MinecraftBlockTypes.WhiteStainedGlass;

                ev.cancel = true;
                system.run(()=>{
                    decrementItemStack(player, itemStack);
                    setBlockPermutation(block, blockType, { color: dyeColor });
                });
            }

            // その他のブロック
            if (block.typeId.includes("glazed_terracotta")) {
                const facingDirection = block.permutation.getState("facing_direction");
                blockType = `minecraft:${dyeColor}_glazed_terracotta`;

                system.run(() => {
                    if (facingDirection) setBlockPermutation(block, blockType, { facing_direction: facingDirection });
                });
            }

            if (block.typeId.includes("candle_cake") || block.typeId.includes("candle")) {
                const lit = block.permutation.getState("lit");
                const candles = block.permutation.getState("candles");
                blockType = block.typeId.includes("candle_cake") ? `minecraft:${dyeColor}_candle_cake` : `minecraft:${dyeColor}_candle`;

                ev.cancel = true;
                system.run(() => {
                    const states = block.typeId.includes("candle_cake") ? { lit } : { lit, candles };
                    setBlockPermutation(block, blockType, states);
                });
            }
        }
    }

    //アメジスト
    if (itemStack?.typeId === MinecraftItemTypes.AmethystShard && !block.typeId.includes("glass_pane") && block.typeId.includes("glass") && block.typeId !== MinecraftBlockTypes.TintedGlass) {
        system.run(()=>{
            decrementItemStack(player, itemStack);
            block.setType(MinecraftBlockTypes.TintedGlass);
        });
    }

    // つた
    if (itemStack?.typeId === "minecraft:vine" && player.isSneaking) {
        if (mossyBlocks.includes(block.typeId)) {
            ev.cancel = true;

            let blockId;
            let states = {};

            switch (block.typeId) {
                case MinecraftBlockTypes.Cobblestone:
                    blockId = MinecraftBlockTypes.MossyCobblestone;
                    break;
                case MinecraftBlockTypes.CobblestoneSlab:
                    states = {
                        top_slot_bit: block.permutation.getState("top_slot_bit"),
                        "minecraft:vertical_half": block.permutation.getState("minecraft:vertical_half"),
                    };
                    break;
                case MinecraftBlockTypes.StoneStairs:
                    blockId = MinecraftBlockTypes.MossyCobblestoneStairs;
                    states = {
                        upside_down_bit: block.permutation.getState("upside_down_bit"),
                        weirdo_direction: block.permutation.getState("weirdo_direction"),
                    };
                    break;
                case MinecraftBlockTypes.CobblestoneWall:
                    blockId = MinecraftBlockTypes.CobblestoneWall;
                    states = {
                        wall_block_type: "mossy_cobblestone",
                        wall_post_bit: block.permutation.getState("wall_post_bit"),
                        wall_connection_type_east: block.permutation.getState("wall_connection_type_east"),
                        wall_connection_type_north: block.permutation.getState("wall_connection_type_north"),
                        wall_connection_type_south: block.permutation.getState("wall_connection_type_south"),
                        wall_connection_type_west: block.permutation.getState("wall_connection_type_west"),
                    };
                    break;
                case MinecraftBlockTypes.StoneBricks:
                    blockId = MinecraftBlockTypes.StoneBricks;
                    states = { stone_brick_type: "mossy" };
                    break;
                case MinecraftBlockTypes.StoneBrickSlab:
                    blockId = MinecraftBlockTypes.MossyStoneBrickSlab;
                    states = {
                        top_slot_bit: block.permutation.getState("top_slot_bit"),
                        "minecraft:vertical_half": block.permutation.getState("minecraft:vertical_half"),
                    };
                    break;
                case MinecraftBlockTypes.StoneBrickStairs:
                    blockId = MinecraftBlockTypes.MossyStoneBrickStairs;
                    states = {
                        upside_down_bit: block.permutation.getState("upside_down_bit"),
                        weirdo_direction: block.permutation.getState("weirdo_direction"),
                    };
                    break;
                case MinecraftBlockTypes.StoneBrickWall:
                    blockId = MinecraftBlockTypes.StoneBrickWall;
                    states = {
                        wall_block_type: "mossy_stone_brick",
                        wall_post_bit: block.permutation.getState("wall_post_bit"),
                        wall_connection_type_east: block.permutation.getState("wall_connection_type_east"),
                        wall_connection_type_north: block.permutation.getState("wall_connection_type_north"),
                        wall_connection_type_south: block.permutation.getState("wall_connection_type_south"),
                        wall_connection_type_west: block.permutation.getState("wall_connection_type_west"),
                    };
                    break;
            }

            if (blockId) {
                system.run(()=>{
                    decrementItemStack(player, itemStack);
                    setBlockPermutation(block, blockId, states);
                });
            }
        }
    }
});