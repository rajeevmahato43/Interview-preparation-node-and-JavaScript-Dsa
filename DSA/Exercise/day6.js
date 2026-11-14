/*
2Sum II - Input Array Is Sorted
Given an array of numbers numbers sorted in ascending order, find two numbers that add up to a target sum `target`. 
Return the positions of the two numbers added by one (`[index1, index2]`). You cannot use the same element twice. 
Assume exactly one answer exists.

numbers = [2, 7, 11, 15], target = 9   Expected Output: [1, 2]
numbers = [2, 3, 4] target = 6         Expected Output: [1, 3]
numbers = [-1, 0] target = -1          Expected Output: [1, 2]
*/

findTwoSum = (numbers, target) => {
  let left=0;
  let right=numbers.length-1

  while(left<right){
    const sum=numbers[right]+ numbers[left]
    if(sum==target){
        return[left+1,right+1]
    }
    if(sum<target){
        left ++
    }else{
        right --
    }

  }
}

//console.log(findTwoSum([2, 7, 11, 15],9))


/*  Container with most water

You are given an integer array `height` of length n. Each number represents a vertical line. 
Find two lines that, together with the ground, form a container that holds the most water. 
Return the maximum amount of water the container can hold.

height = [1, 8, 6, 2, 5, 4, 8, 3, 7] Expected Output: `49`
height = [4, 3, 2, 1, 4]             Expected Output: `16`

*/

function WaterArea(arr){
  let left=0, right=arr.length-1
  let maxArea=0

  while(left<right){
    const area= (right-left)*(Math.min(arr[left],arr[right]))  // area=width*height, right-left=width, height=min(leftHeight,rightHeight) 
    maxArea= Math.max(area,maxArea)
    if(arr[left]<arr[right]){
       left ++

    }else{
        right--
    }

  }

  return maxArea
}

//console.log(WaterArea([1, 8, 6, 2, 5, 4, 8, 3, 7]))


/* 3sum

Given an integer array `nums`, find all unique groups of three numbers 
`[nums[i], nums[j], nums[k]]` that add up to `0` (`nums[i] + nums[j] + nums[k] === 0`). 
The result must not have duplicate groups.

nums = [-1, 0, 1, 2, -1, -4] Expected Output: [[-1, -1, 2], [-1, 0, 1]]
nums = [0, 1, 1] Expected Output: []
nums = [0, 0, 0] Expected Output: [[0, 0, 0]]
*/

function find3sum(arr){
   let sortedArr=arr.sort((a,b)=>a-b) 
    let result=[]
    // [ -4, -1, -1, 0, 1, 2 ]
    for(let i=0;i<arr.length-2;i++){
       left=i+1;
       right=arr.length-1
        while(left<right){
            sum=arr[i]+arr[left]+arr[right]
            if(sum==0){
                result.push([arr[i],arr[left],arr[right]])

                while(arr[left] == arr[left+1]){left++}  // skip duplicates
                while(arr[right] == arr[right-1]){right--}
                left++
                right--
            }
            if(sum<0){
                    left++
            }else{
                right--
            }
        }


    }
    return result
}
//console.log(find3sum([-1, 0, 1, 2, -1, -4]))

/* Given a string s, return true if s can be a palindrome after deleting at most one character from it.

Input 1: s = "aba"  Expected Output: true
Input 2: s = "abca" Expected Output: true (delete 'c')
Input 3: s = "abc"   Expected Output: false
*/

function isValidPalindrome(str){
    let left=0,right=str.length-1
    function checkPalindrome(l, r){
        while(l<r){
            if(str[l] !==str[r]) return false
            l++
            r--
        }
        return true

    }
    while (left<=right) {
        if(str[left]!==str[right]){
            return (checkPalindrome(left+1,right)|| checkPalindrome(left, right-1));
        }
        left++
        right--
    }
    return true

}
//console.log(isValidPalindrome('dee'))

/*Sort Transformed Array
Given a sorted integer array nums and three numbers a, b, and c, calculate 
f(x)=ax2+bx+c for each element and return the numbers in sorted order in 
O(n) time.

Input 1: nums = [-4, -2, 2, 4], a = 1, b = 3, c = 5 
Expected Output: [3, 9, 15, 33]
Input 2: nums = [-4, -2, 2, 4], a = -1, b = 3, c = 5 
Expected Output: [-23, -5, 1, 7]
*/
function sortTransformedArray(arr, a, b, c){
    let left=0,right=arr.length-1
    const result= new Array(arr.length)
    const fx=((x)=> a*x*x+b*x+c)
  // Here a is the coefficient of x^2. If a is negative, all the values of f(x) will be negative and the largest value will be at the ends of the array.
    if(a < 0){
        let index=0
        while(left<=right){
            let leftLine=fx(arr[left])
            let rightLine=fx(arr[right])
            if(leftLine<=rightLine){ // If a is negative, the largest value will be at the ends of the array.
                result[index]=leftLine
                left++
            }else{
                result[index]=rightLine
                right--
            }

                index++
        }

    }else{
        let index=arr.length-1
        while(left<=right){
            let leftLine=fx(arr[left])
            let rightLine=fx(arr[right])
            if(leftLine>=rightLine){  // If a is positive, the largest value will be at the ends of the array.
                result[index]=leftLine
                left++
            }else{
                result[index]=rightLine
                right--
            }

                index--
        }
    }

    return result;

}

//console.log(sortTransformedArray([-4, -2, 2, 4], -1, 3, 5 ))


/*Trapping Rain Water 
Given an array height representing bar heights of width 1, calculate how much water can be trapped after it rains, using two pointers in 
O(n) time and O(1) space.

Input 1: height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] 
Expected Output: 6
Input 2: height = [4, 2, 0, 3, 2, 5] 
Expected Output: 9

*/
function trapRainWater(arr){
    let left=0,right=arr.length-1
    let waterArea=0;
    let leftMax=0, rightMax=0


    //waterAtIndex =min(maxLeft, maxRight) - height[index] Formula to calculate water on give point
    while(left<=right){
        if(arr[left]<=arr[right]){  // very important condition to check which side to process next left or right, then move that pointer.
        leftMax=Math.max(arr[left],leftMax)
        let areaLeft=leftMax-arr[left]
         waterArea +=areaLeft;
        left++
        }else{
        rightMax=Math.max(arr[right],rightMax)
        let areaRight=rightMax-arr[right]
         waterArea+=areaRight
        right--
        }

    }

    return waterArea;


}

console.log(trapRainWater([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))


// Always Use a condition to check which side to process next left or right, then move that pointer.