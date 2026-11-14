/* Remove Duplicates from Sorted Array
Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place so that each unique element appears only once. Keep the relative order of the elements the same. Then return the number of unique elements in nums.

Let k be the count of unique elements. You must change nums so that the first k spots hold the unique numbers in their original order.

Input 1: nums = [1, 1, 2] 
Expected Output: k = 2, nums = [1, 2, _]
Input 2: nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] 
Expected Output: k = 5, nums = [0, 1, 2, 3, 4, _, _, _, _, _]

*/

function removeDuplicate(arr){
    let slow=0

    for(let i=1;i<arr.length;i++){
            if(arr[slow]!=arr[i]){
                slow++
                arr[slow]=arr[i]
            }
        }
    return slow+1
}
const input=[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
/*const k=removeDuplicate(input)
  console.log(k,input.slice(0,k))*/

  

/* Sort Colors
  Given an array nums with n objects colored red (0), white (1), or blue (2), sort them in-place so that objects of the same color are adjacent,
  with the colors in the order red, white, and blue.

You must solve this problem without using the library's sort function and in a single pass using O(1) constant extra space.
Input 1: nums = [2, 0, 2, 1, 1, 0] 
Output: [0, 0, 1, 1, 2, 2]
Input 2: nums = [2, 0, 1] 
Output: [0, 1, 2]
Input 3: nums = [0] 
Output: [0]
*/

function colorSort(arr){
 let slow=0
 for(let i=0; i<arr.length;i++){


 }
}
